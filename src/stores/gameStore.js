import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { alertDialog } from '@/composables/dialogService'
import { MAX_PLANTING_TIME, RUNNING_SAVE_INTERVAL_MS, TIMER_TICK_INTERVAL_MS } from '@/config/gameBalance'
import { PREVIEW_BACKGROUND_ITEMS, PREVIEW_SKILL_ITEMS, SHOP_CATEGORIES } from '@/config/shopCatalog'
import { TREE_TYPES } from '@/config/treeCatalog'
import { getGlobalLevelFromXP } from '@/local-backend/domain/leveling'
import { normalizeNote } from '@/local-backend/domain/noteModel'
import { isSameProjectId, normalizeProject } from '@/local-backend/domain/projectModel'
import { buildSaveSummary, normalizeSaveIndex } from '@/local-backend/domain/saveSchema'
import {
  createNoteRecord,
  deleteUserNote,
  renameUserNote,
  updateUserNote,
  updateUserNoteTags
} from '@/local-backend/services/notebookService'
import {
  applyCompletedTreeCycles,
  buildPlantingNoteInput,
  getFinishedCycles,
  getTreeYield as getTreeYieldFromHarvestService
} from '@/local-backend/services/harvestService'
import {
  createProjectRecord,
  deleteProjectFromList,
  mergeProjectData,
  moveProjectToTheme as moveProjectToThemeList,
  reorderProjects as reorderProjectList
} from '@/local-backend/services/projectService'
import {
  buildSaveData,
  createSaveSlotData,
  persistSlotDataToRepository,
  readLegacySaveData,
  readSaveIndex,
  readSlotData,
  removeSlotData,
  shouldPersistActiveSlot,
  writeSaveIndex
} from '@/local-backend/services/saveService'
import {
  buildShopCatalog,
  buildShopItems,
  canPurchaseShopItem as canPurchaseCatalogItem,
  ownsShopItem as ownsCatalogItem
} from '@/local-backend/services/shopService'
import {
  createThemeRecord,
  deleteThemeFromLists,
  renameThemeInList
} from '@/local-backend/services/themeService'
import { getRunningTimerDelta } from '@/local-backend/services/timerService'
import {
  clearStoredSession,
  deleteSlot as deleteSelfHostedCloudSlot,
  getStoredSession,
  listSlots as listSelfHostedCloudSlots,
  login as loginSelfHosted,
  register as registerSelfHosted,
  upsertSlot as upsertSelfHostedCloudSlot
} from '@/cloud-backend/selfHostedSyncApi'

export const useGameStore = defineStore('game', () => {
  // === 玩家数据 ===
  const coins = ref(0)
  const unlockedTreeIds = ref(['t1'])
  const ownedBoostIds = ref([])
  const unlockedBackgroundIds = ref(['background_default'])
  const globalXP = ref(0)
  
  const themes = ref([]) 
  const projects = ref([]) 
  const notebook = ref([]) 
  
  const activeView = ref('dashboard')
  const bootStage = ref('slot-select')
  const saveIndex = ref({ version: 1, lastSelectedSlotId: null, slots: [] })
  const activeSlotId = ref(null)
  const isHydrating = ref(false)

  // === 运行时状态 ===
  const activeThemeId = ref(null)
  const activeProjectId = ref(null) 
  const runningProjectId = ref(null)
  
  const activeTreeId = ref(null)
  const isRunning = ref(false)
  const timer = ref(0)          
  
  const isNightMode = ref(false)
  const offlineEarnings = ref(null)

  // === 计算属性 ===
  const globalLevel = computed(() => Math.floor(Math.sqrt(globalXP.value / 100)) + 1)
  
  const globalLevelProgress = computed(() => {
    const level = globalLevel.value
    const currentBaseXP = 100 * Math.pow(level - 1, 2)
    const nextLevelXP = 100 * Math.pow(level, 2)
    const needed = nextLevelXP - currentBaseXP
    const current = globalXP.value - currentBaseXP
    
    if (needed === 0) return 0
    return Math.min((current / needed) * 100, 100)
  })
  
  const activeProject = computed(() => projects.value.find(p => p.id === activeProjectId.value))
  const runningProject = computed(() => projects.value.find(p => p.id === runningProjectId.value))

  const activeTree = computed(() => TREE_TYPES.find(t => t.id === activeTreeId.value))
  const maxTime = computed(() => activeTree.value ? activeTree.value.time : 25 * 60)
  
  const progressPercentage = computed(() => {
    if (activeProjectId.value !== runningProjectId.value) return 0 
    return activeTree.value ? Math.min((timer.value / maxTime.value) * 100, 100) : 0
  })
  
  const inventoryTrees = computed(() => TREE_TYPES.filter(t => unlockedTreeIds.value.includes(t.id)))
  const shopItems = computed(() =>
    buildShopItems({
      treeTypes: TREE_TYPES,
      previewSkillItems: PREVIEW_SKILL_ITEMS,
      previewBackgroundItems: PREVIEW_BACKGROUND_ITEMS
    })
  )
  const shopCatalog = computed(() => buildShopCatalog(SHOP_CATEGORIES, shopItems.value))
  const saveSlots = computed(() => saveIndex.value.slots || [])
  const activeSlotMeta = computed(() =>
    saveSlots.value.find(slot => slot.id === activeSlotId.value) || null
  )

  function getShopOwnershipContext() {
    return {
      unlockedTreeIds: unlockedTreeIds.value,
      ownedBoostIds: ownedBoostIds.value,
      unlockedBackgroundIds: unlockedBackgroundIds.value,
      globalLevel: globalLevel.value,
      coins: coins.value
    }
  }

  function ownsShopItem(item) {
    return ownsCatalogItem(item, getShopOwnershipContext())
  }

  function canPurchaseShopItem(item) {
    return canPurchaseCatalogItem(item, getShopOwnershipContext())
  }

  function saveSaveIndex() {
    writeSaveIndex(saveIndex.value)
  }

  function loadSaveIndex() {
    const index = readSaveIndex()
    saveIndex.value = index ? normalizeSaveIndex(index) : normalizeSaveIndex()
    return saveIndex.value
  }

  function updateSlotMeta(slotId, updates = {}) {
    const slot = saveSlots.value.find(item => item.id === slotId)
    if (!slot) return null
    Object.assign(slot, updates)
    return slot
  }

  function persistSlotData(slotId, saveData, options = {}) {
    return persistSlotDataToRepository({
      saveIndex: saveIndex.value,
      activeSlotName: activeSlotMeta.value?.name,
      slotId,
      saveData,
      options
    })
  }

  function createNote({
    title,
    content,
    projectIds = [],
    type = 'planting',
    source = 'user',
    eventType = null,
    awardCoins = source === 'user',
    id = Date.now()
  }) {
    const result = createNoteRecord({
      title,
      content,
      projectIds,
      type,
      source,
      eventType,
      awardCoins,
      id
    })

    if (result.error) {
      void alertDialog(result.error.message, {
        title: result.error.title
      })
      return null
    }

    if (result.earnedCoins > 0) coins.value += result.earnedCoins
    notebook.value.unshift(result.note)
    return result.note
  }

  // === 核心逻辑 ===
  function getTreeYield(tree, project) {
    return getTreeYieldFromHarvestService(tree, project)
  }

  function completeCycle(times = 1, projectId = runningProjectId.value) {
    const targetProject = projects.value.find(p => p.id === projectId)
    if (!targetProject || !activeTree.value) return

    const result = applyCompletedTreeCycles(targetProject, activeTree.value, times)
    if (result) globalXP.value += result.totalXP
  }

  function uploadNote(title, content, projectIds = []) {
    return createNote({
      title,
      content,
      projectIds,
      type: 'planting',
      source: 'user'
    })
  }

  function createEssayNote(title, content, projectIds = []) {
    return createNote({
      title,
      content,
      projectIds,
      type: 'essay',
      source: 'user',
      awardCoins: false
    })
  }

  function renameNote(noteId, newTitle) {
    const note = notebook.value.find(n => n.id === noteId)
    renameUserNote(note, newTitle)
  }

  function updateNote(noteId, payload = {}) {
    const note = notebook.value.find(n => n.id === noteId)
    const result = updateUserNote(note, payload)

    if (result.error) {
      void alertDialog(result.error.message, {
        title: result.error.title
      })
    }

    return result.ok
  }

  function createSystemNote({
    title,
    content,
    projectIds = [],
    eventType = null
  }) {
    return createNote({
      title,
      content,
      projectIds,
      type: 'system',
      source: 'system',
      eventType,
      awardCoins: false
    })
  }

  function deleteNote(noteId) {
    const result = deleteUserNote(notebook.value, noteId)
    if (result.coinRefund > 0) coins.value = Math.max(0, coins.value - result.coinRefund)
    return result.deleted
  }

  function updateNoteTags(noteId, newProjectIds) {
    const note = notebook.value.find(n => n.id === noteId)
    updateUserNoteTags(note, newProjectIds)
  }

  function toggleNightMode() {
    isNightMode.value = !isNightMode.value
  }

  // === 计时器与动作控制 ===
  let timerInterval = null
  let lastTimestamp = 0
  let lastRuntimeSaveAt = 0

  function syncRunningTimer(now = Date.now()) {
    const result = getRunningTimerDelta({
      isRunning: isRunning.value,
      hasActiveTree: Boolean(activeTree.value),
      timer: timer.value,
      lastTimestamp,
      now,
      maxTime: MAX_PLANTING_TIME
    })
    lastTimestamp = result.nextTimestamp
    timer.value = result.nextTimer

    if (result.actualDelta > 0 && now - lastRuntimeSaveAt >= RUNNING_SAVE_INTERVAL_MS) {
      lastRuntimeSaveAt = now
      saveToLocalStorage()
    }

    return result.actualDelta
  }

  function flushRuntimeState() {
    if (
      !activeSlotId.value ||
      bootStage.value !== 'in-game' ||
      offlineEarnings.value ||
      isHydrating.value
    ) {
      return
    }

    if (isRunning.value) syncRunningTimer()
    saveActiveSlot(false)
  }

  function handleVisibilityChange() {
    if (!isRunning.value) return

    if (document.visibilityState === 'hidden') {
      syncRunningTimer()
      saveToLocalStorage()
      return
    }

    if (document.visibilityState === 'visible') {
      syncRunningTimer()
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flushRuntimeState)
    window.addEventListener('beforeunload', flushRuntimeState)
  }

  function gameTick() {
    if (!activeTree.value || !isRunning.value) {
      stopTimer()
      return
    }

    if (timer.value >= MAX_PLANTING_TIME) return
    syncRunningTimer()
  }

  function startTimer() {
    if (isRunning.value) return 
    if (timer.value >= MAX_PLANTING_TIME) return 

    isRunning.value = true
    lastTimestamp = Date.now()
    lastRuntimeSaveAt = lastTimestamp
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(gameTick, TIMER_TICK_INTERVAL_MS)
  }

  function stopTimer() {
    isRunning.value = false
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function toggleAction() {
    if (activeProjectId.value !== runningProjectId.value) return
    if (isRunning.value) { 
      isRunning.value = false; stopTimer() 
    } else { 
      if (activeTreeId.value && runningProjectId.value) startTimer() 
    }
  }

  function startAction(treeId) {
    if (!activeProjectId.value || !unlockedTreeIds.value.includes(treeId)) return
    if (runningProjectId.value !== activeProjectId.value) {
        stopTimer()
        runningProjectId.value = activeProjectId.value 
        timer.value = 0 
    }
    if (activeTreeId.value !== treeId) { 
        activeTreeId.value = treeId; timer.value = 0 
    }
    startTimer()
  }

  function submitHarvest(content, confirmedProjectId = runningProjectId.value) {
    const targetProject = projects.value.find(p => p.id === confirmedProjectId)
    if (!targetProject || !activeTree.value) return false

    const finishedCycles = getFinishedCycles(timer.value, activeTree.value)

    if (finishedCycles > 0) {
      completeCycle(finishedCycles, targetProject.id)
      targetProject.totalTimeSpent += timer.value

      const noteInput = buildPlantingNoteInput(targetProject, content)
      if (noteInput) createNote(noteInput)

    }

    stopTimer()
    timer.value = 0
    runningProjectId.value = null
    return true
  }

  function openMap() { activeView.value = 'map' }

  function openThemeForest(themeId) {
    activeThemeId.value = themeId
    activeView.value = 'forest'
  }
  
  function openForest() { 
    activeThemeId.value = null 
    activeView.value = 'forest' 
  }

  // === 管理功能 ===
  function createTheme(name) { 
    themes.value.push(createThemeRecord(name)) 
  }

  function renameTheme(id, newName) { return renameThemeInList(themes.value, id, newName) }
  function deleteTheme(id) {
    const result = deleteThemeFromLists(themes.value, projects.value, id)
    themes.value = result.nextThemes
    projects.value = result.nextProjects
  }

  function createProject(name, themeId = null) { 
    const newProj = createProjectRecord(name, themeId)
    projects.value.push(newProj)
    selectProject(newProj.id) 
  }

  function renameProject(id, newName) { const project = projects.value.find(p => p.id === id); if (project) project.name = newName }

  function deleteProject(id, options = {}) {
    const result = deleteProjectFromList(projects.value, notebook.value, id, options)
    if (!result) return false

    if (isSameProjectId(runningProjectId.value, id)) {
        stopTimer(); isRunning.value = false; runningProjectId.value = null; timer.value = 0
    }
    if (isSameProjectId(activeProjectId.value, id)) { activeProjectId.value = null; activeView.value = 'forest' }
    projects.value = result.nextProjects

    createSystemNote(result.systemNote)

    return true
  }

  function mergeProjects(sourceProjectId, targetProjectId, options = {}) {
    const result = mergeProjectData(
      projects.value,
      notebook.value,
      sourceProjectId,
      targetProjectId,
      options
    )
    if (!result) return false

    if (isSameProjectId(activeProjectId.value, sourceProjectId)) activeProjectId.value = result.targetProject.id
    if (isSameProjectId(runningProjectId.value, sourceProjectId)) runningProjectId.value = result.targetProject.id

    projects.value = result.nextProjects
    notebook.value = result.nextNotebook

    createSystemNote(result.systemNote)

    return true
  }

  function reorderProjects(sourceProjectId, targetProjectId, position = 'before') {
    const nextProjects = reorderProjectList(
      projects.value,
      sourceProjectId,
      targetProjectId,
      position
    )
    if (!nextProjects) return false
    projects.value = nextProjects
    return true
  }

  function moveProjectToTheme(projectId, themeId = null) {
    const nextProjects = moveProjectToThemeList(projects.value, projectId, themeId)
    if (!nextProjects) return false
    projects.value = nextProjects
    return true
  }

  function getSaveData() {
    return buildSaveData({
      activeSlotId: activeSlotId.value,
      activeSlotName: activeSlotMeta.value?.name,
      coins: coins.value,
      globalXP: globalXP.value,
      unlockedTreeIds: unlockedTreeIds.value,
      ownedBoostIds: ownedBoostIds.value,
      unlockedBackgroundIds: unlockedBackgroundIds.value,
      themes: themes.value,
      projects: projects.value,
      notebook: notebook.value,
      activeView: activeView.value,
      activeThemeId: activeThemeId.value,
      activeProjectId: activeProjectId.value,
      runningProjectId: runningProjectId.value,
      activeTreeId: activeTreeId.value,
      isRunning: isRunning.value,
      timer: timer.value,
      isNightMode: isNightMode.value
    })
  }

  function resetGameState() {
    stopTimer()
    coins.value = 0
    unlockedTreeIds.value = ['t1']
    ownedBoostIds.value = []
    unlockedBackgroundIds.value = ['background_default']
    globalXP.value = 0
    themes.value = []
    projects.value = []
    notebook.value = []
    activeView.value = 'forest'
    activeThemeId.value = null
    activeProjectId.value = null
    runningProjectId.value = null
    activeTreeId.value = null
    isRunning.value = false
    timer.value = 0
    isNightMode.value = false
    offlineEarnings.value = null
  }

  function applySaveData(data, silent = false) {
    try {
      isHydrating.value = true
      stopTimer()

      coins.value = data.coins || 0
      globalXP.value = data.globalXP || 0
      unlockedTreeIds.value = data.unlockedTreeIds || ['t1']
      ownedBoostIds.value = data.ownedBoostIds || []
      unlockedBackgroundIds.value = data.unlockedBackgroundIds || ['background_default']
      themes.value = (data.themes || []).map(t => ({
        ...t,
        x: t.x !== undefined ? t.x : Math.floor(Math.random() * 70) + 15,
        y: t.y !== undefined ? t.y : Math.floor(Math.random() * 70) + 15
      }))
      projects.value = (data.projects || []).map(normalizeProject)
      notebook.value = (data.notebook || []).map(normalizeNote)

      activeView.value = data.activeView || (data.activeProjectId ? 'dashboard' : 'forest')
      activeThemeId.value = data.activeThemeId || null
      activeProjectId.value = data.activeProjectId || null
      const savedRunningProjectId = data.runningProjectId || data.activeProjectId || null
      activeTreeId.value = data.activeTreeId || null
      timer.value = data.timer || 0
      isNightMode.value = data.isNightMode || false

      const wasRunning = data.isRunning || false
      const lastSave = data.timestamp || Date.now()
      offlineEarnings.value = null

      if (wasRunning && activeTreeId.value && savedRunningProjectId) {
        const now = Date.now()
        const secondsPassed = Math.floor((now - lastSave) / 1000)

        if (secondsPassed > 60) {
          const tree = TREE_TYPES.find(t => t.id === activeTreeId.value)
          if (tree) {
            const totalTime = timer.value + secondsPassed
            const finalTimer = Math.min(totalTime, MAX_PLANTING_TIME)
            const effectiveSeconds = Math.max(0, finalTimer - timer.value)

            offlineEarnings.value = {
              projectId: savedRunningProjectId,
              tree,
              secondsPassed: effectiveSeconds,
              newTimer: finalTimer
            }
            runningProjectId.value = savedRunningProjectId
            isRunning.value = false
          }
        } else if (secondsPassed > 0) {
          timer.value += secondsPassed
          if (timer.value > MAX_PLANTING_TIME) timer.value = MAX_PLANTING_TIME
          runningProjectId.value = savedRunningProjectId
          startTimer()
        } else {
          runningProjectId.value = savedRunningProjectId
          startTimer()
        }
      } else {
        isRunning.value = false
        runningProjectId.value = savedRunningProjectId
      }
      if (!silent) saveToLocalStorage()
      return true
    } catch (error) {
      console.error(error)
      if (!silent) {
        void alertDialog('存档损坏', {
          title: '读取失败'
        })
      }
      return false
    } finally {
      isHydrating.value = false
    }
  }

  function claimOfflineEarnings() {
    if (!offlineEarnings.value) return
    const { newTimer } = offlineEarnings.value
    timer.value = newTimer 
    
    if (timer.value < MAX_PLANTING_TIME) {
      startTimer()
    } else {
      isRunning.value = false
    }
    
    offlineEarnings.value = null
    saveToLocalStorage()
  }

  function discardOfflineEarnings() { offlineEarnings.value = null; isRunning.value = false; saveToLocalStorage() }

  // === 云同步与认证逻辑 ===
  const user = ref(null)
  const syncStatus = ref('idle')
  let cloudSyncTimeout = null

  function getLocalSlotSaveData(slotId) {
    if (!slotId) return null
    if (slotId === activeSlotId.value && bootStage.value === 'in-game') {
      return getSaveData()
    }
    return readSlotData(slotId)
  }

  async function pushSlotToCloud(slotId) {
    if (!user.value || !slotId) return false

    const slot = saveSlots.value.find(item => item.id === slotId)
    const saveData = getLocalSlotSaveData(slotId)
    if (!slot || !saveData) return false

    await upsertSelfHostedCloudSlot(slotId, {
      name: slot.name || saveData.slotName || 'Untitled Save',
      saveData: {
        ...saveData,
        slotId,
        slotName: slot.name || saveData.slotName
      },
      summary: buildSaveSummary(saveData),
      clientUpdatedAt: slot.updatedAt || new Date(saveData.timestamp || Date.now()).toISOString()
    })
    return true
  }

  function scheduleActiveSlotCloudSync() {
    if (!user.value || !activeSlotId.value) return
    if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout)
    cloudSyncTimeout = setTimeout(() => {
      void pushSlotToCloud(activeSlotId.value).catch(error => {
        console.error(error)
      })
    }, 5000)
  }

  async function mergeSelfHostedCloudSlots() {
    syncStatus.value = 'syncing'
    const cloudSlots = await listSelfHostedCloudSlots()

    for (const cloudSlot of cloudSlots) {
      const cloudSaveData = {
        ...cloudSlot.saveData,
        slotId: cloudSlot.slotId,
        slotName: cloudSlot.name || cloudSlot.saveData?.slotName
      }
      const localSlot = saveSlots.value.find(slot => slot.id === cloudSlot.slotId)

      if (!localSlot) {
        persistSlotData(cloudSlot.slotId, cloudSaveData, {
          markPlayed: false,
          slotName: cloudSaveData.slotName,
          updateSelection: false
        })
        updateSlotMeta(cloudSlot.slotId, {
          source: 'cloud',
          updatedAt: cloudSlot.clientUpdatedAt || cloudSlot.serverUpdatedAt,
          lastPlayedAt: cloudSlot.clientUpdatedAt || cloudSlot.serverUpdatedAt
        })
        continue
      }

      const localTime = Date.parse(localSlot.updatedAt || localSlot.lastPlayedAt || 0)
      const cloudTime = Date.parse(cloudSlot.clientUpdatedAt || cloudSlot.serverUpdatedAt || 0)

      if (cloudTime > localTime) {
        persistSlotData(cloudSlot.slotId, cloudSaveData, {
          markPlayed: false,
          slotName: cloudSaveData.slotName,
          updateSelection: false
        })
        updateSlotMeta(cloudSlot.slotId, {
          source: 'cloud',
          updatedAt: cloudSlot.clientUpdatedAt || cloudSlot.serverUpdatedAt,
          lastPlayedAt: cloudSlot.clientUpdatedAt || cloudSlot.serverUpdatedAt
        })
      } else if (localTime > cloudTime) {
        await pushSlotToCloud(localSlot.id)
      }
    }

    saveSaveIndex()
    syncStatus.value = 'idle'
    return cloudSlots.length
  }

  async function initAuth() {
    const session = getStoredSession()
    user.value = session?.user || null
  }

  async function loginWithEmail(email, password) {
    try {
      const session = await loginSelfHosted(email, password)
      user.value = session.user
      await mergeSelfHostedCloudSlots()
      return true
    } catch (error) {
      void alertDialog('Login failed: ' + error.message, {
        title: 'Login failed'
      })
      return false
    }
  }
  async function registerWithEmail(email, password) {
    try {
      const session = await registerSelfHosted(email, password)
      user.value = session.user
      await uploadSaveToCloud({ silent: true })
      void alertDialog('Account created and signed in.', {
        title: 'Sign up complete'
      })
      return true
    } catch (error) {
      void alertDialog('Sign up failed: ' + error.message, {
        title: 'Sign up failed'
      })
      return false
    }
  }
  async function logout() {
    clearStoredSession()
    user.value = null
  }
  async function uploadSaveToCloud(options = {}) {
    if (!user.value) {
      void alertDialog('Please sign in first.', {
        title: 'Not signed in'
      })
      return false
    }

    try {
      syncStatus.value = 'syncing'
      if (activeSlotId.value) saveActiveSlot(false)

      let uploadedCount = 0
      for (const slot of saveSlots.value) {
        if (await pushSlotToCloud(slot.id)) uploadedCount += 1
      }

      syncStatus.value = 'idle'
      if (!options.silent) {
        void alertDialog(`Synced ${uploadedCount} save slot(s).`, {
          title: 'Sync complete'
        })
      }
      return true
    } catch (error) {
      syncStatus.value = 'error'
      console.error(error)
      if (!options.silent) {
        void alertDialog('Cloud save failed: ' + error.message, {
          title: 'Sync failed'
        })
      }
      return false
    }
  }
  async function downloadSaveFromCloud(options = {}) {
    if (!user.value) {
      void alertDialog('Please sign in first.', {
        title: 'Not signed in'
      })
      return false
    }

    try {
      const count = await mergeSelfHostedCloudSlots()
      if (!options.silent) {
        void alertDialog(`Pulled ${count} cloud save slot(s).`, {
          title: 'Sync complete'
        })
      }
      return true
    } catch (error) {
      syncStatus.value = 'error'
      console.error(error)
      if (!options.silent) {
        void alertDialog('Cloud load failed: ' + error.message, {
          title: 'Load failed'
        })
      }
      return false
    }
  }
  function saveActiveSlot(markPlayed = false) {
    if (!activeSlotId.value) return false
    persistSlotData(activeSlotId.value, getSaveData(), {
      markPlayed,
      slotName: activeSlotMeta.value?.name
    })
    return true
  }

  function saveToLocalStorage() {
    if (
      !shouldPersistActiveSlot({
        activeSlotId: activeSlotId.value,
        bootStage: bootStage.value,
        offlineEarnings: offlineEarnings.value,
        isHydrating: isHydrating.value
      })
    ) {
      return
    }
    if (saveActiveSlot(false)) scheduleActiveSlotCloudSync()
  }

  function createSaveSlot(name, initialData = null) {
    const { slotId, slotName, slotData } = createSaveSlotData(
      name,
      saveSlots.value.length,
      initialData
    )

    persistSlotData(slotId, slotData, { markPlayed: false, slotName })
    void pushSlotToCloud(slotId).catch(error => {
      console.error(error)
    })
    return slotId
  }

  function renameSaveSlot(slotId, newName) {
    const trimmed = newName?.trim()
    if (!trimmed) return false

    const slot = updateSlotMeta(slotId, { name: trimmed, updatedAt: new Date().toISOString() })
    if (!slot) return false

    const saveData = readSlotData(slotId)
    if (saveData) {
      persistSlotData(slotId, { ...saveData, slotName: trimmed }, { slotName: trimmed, updateSelection: false })
    } else {
      saveSaveIndex()
    }
    void pushSlotToCloud(slotId).catch(error => {
      console.error(error)
    })
    return true
  }

  function deleteSaveSlot(slotId) {
    removeSlotData(slotId)
    saveIndex.value.slots = saveSlots.value.filter(slot => slot.id !== slotId)

    if (activeSlotId.value === slotId) {
      activeSlotId.value = null
      resetGameState()
      bootStage.value = 'slot-select'
    }

    if (saveIndex.value.lastSelectedSlotId === slotId) {
      saveIndex.value.lastSelectedSlotId = saveSlots.value[0]?.id || null
    }

    saveSaveIndex()
    if (user.value) {
      void deleteSelfHostedCloudSlot(slotId).catch(error => {
        console.error(error)
      })
    }
    return true
  }

  function loadSlot(slotId) {
    const data = readSlotData(slotId)
    if (!data) return false

    activeSlotId.value = slotId
    return applySaveData(data, true)
  }

  function enterSlot(slotId) {
    if (activeSlotId.value && bootStage.value === 'in-game') {
      saveActiveSlot(true)
    }

    const loaded = loadSlot(slotId)
    if (!loaded) return false

    bootStage.value = 'in-game'
    updateSlotMeta(slotId, { lastPlayedAt: new Date().toISOString() })
    saveIndex.value.lastSelectedSlotId = slotId
    saveSaveIndex()
    if (!offlineEarnings.value) saveActiveSlot(true)
    return true
  }

  function exitToSaveSelection() {
    if (activeSlotId.value) saveActiveSlot(true)
    bootStage.value = 'slot-select'
    stopTimer()
  }

  function importSaveData(jsonString, options = {}) {
    const {
      silent = false,
      targetSlotId = activeSlotId.value,
      createNewSlot = false,
      slotName = null
    } = options

    try {
      const data = JSON.parse(jsonString)

      if (createNewSlot) {
        const newSlotId = createSaveSlot(slotName || data.slotName || data.name, data)
        return newSlotId
      }

      if (!targetSlotId) return false

      const targetMeta = saveSlots.value.find(slot => slot.id === targetSlotId)
      persistSlotData(
        targetSlotId,
        { ...data, slotId: targetSlotId, slotName: targetMeta?.name || slotName || data.slotName },
        { markPlayed: false, slotName: targetMeta?.name || slotName || data.slotName, updateSelection: false }
      )

      if (activeSlotId.value === targetSlotId) {
        applySaveData(
          {
            ...data,
            slotId: targetSlotId,
            slotName: targetMeta?.name || slotName || data.slotName
          },
          silent
        )
      }

      return targetSlotId
    } catch (error) {
      console.error(error)
      if (!silent) {
        void alertDialog('存档损坏', {
          title: '导入失败'
        })
      }
      return false
    }
  }

  function importSaveAsNewSlot(jsonString, slotName = null) {
    return importSaveData(jsonString, { createNewSlot: true, slotName })
  }

  function migrateLegacySingleSaveIfNeeded() {
    loadSaveIndex()
    if (saveSlots.value.length > 0) return

    try {
      const legacyData = readLegacySaveData()
      if (!legacyData) return
      createSaveSlot('主档案', {
        ...legacyData,
        activeView: legacyData.activeView || (legacyData.activeProjectId ? 'dashboard' : 'forest')
      })
    } catch (error) {
      console.error(error)
    }
  }

  function initSaveSystem() {
    migrateLegacySingleSaveIfNeeded()
    loadSaveIndex()
    if (!activeSlotId.value) resetGameState()
    bootStage.value = 'slot-select'
  }

  watch(
    [coins, globalXP, unlockedTreeIds, ownedBoostIds, unlockedBackgroundIds, themes, projects, notebook, activeView, activeThemeId, activeProjectId, runningProjectId, activeTreeId, isRunning, isNightMode],
    () => { saveToLocalStorage() },
    { deep: true }
  )

  function getTreeIcon(id) { const t = TREE_TYPES.find(tree => tree.id === id); return t ? t.icon : '❓' }
  function downloadSaveFile(slotId = activeSlotId.value) { 
    if (!slotId) return

    const data =
      slotId === activeSlotId.value
        ? getSaveData()
        : readSlotData(slotId)
    if (!data) return

    const slotName =
      saveSlots.value.find(slot => slot.id === slotId)?.name || data.slotName || 'save'
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `minerva_${slotName}_${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }
  function selectProject(id) { activeProjectId.value = id; activeView.value = 'dashboard' }
  function openShop() { activeView.value = 'shop' }
  function openNotebook() { activeView.value = 'notebook' }
  function buyTree(tree) { if (unlockedTreeIds.value.includes(tree.id)) return; if (coins.value >= tree.price) { coins.value -= tree.price; unlockedTreeIds.value.push(tree.id) } }
  function purchaseShopItem(item) {
    if (!item) return false
    if (item.type === 'tree') {
      const tree = TREE_TYPES.find(treeItem => treeItem.id === item.productId)
      if (!tree || !canPurchaseShopItem(item)) return false
      buyTree(tree)
      return true
    }

    if (item.availability !== 'available') {
      void alertDialog('该内容暂未开放。', {
        title: '暂不可用'
      })
      return false
    }

    if (!canPurchaseShopItem(item)) return false
    coins.value -= item.price || 0

    if (item.type === 'boost') ownedBoostIds.value.push(item.id)
    if (item.type === 'background') unlockedBackgroundIds.value.push(item.id)
    return true
  }
  function cheatAddCoins() { coins.value += 1000; globalXP.value += 1000 }

  return { 
    bootStage, saveIndex, saveSlots, activeSlotId, activeSlotMeta,
    themes, projects, globalXP, globalLevel, globalLevelProgress, coins, unlockedTreeIds, ownedBoostIds, unlockedBackgroundIds, activeView, notebook,
    activeProjectId, activeProject, runningProjectId, runningProject, activeThemeId,
    activeTreeId, activeTree, timer, maxTime, isRunning, progressPercentage, 
    isNightMode, TREE_TYPES, SHOP_CATEGORIES, shopItems, shopCatalog, inventoryTrees,
    user, syncStatus, offlineEarnings, MAX_PLANTING_TIME, 
    
    initSaveSystem, createSaveSlot, renameSaveSlot, deleteSaveSlot, enterSlot, exitToSaveSelection,
    saveActiveSlot, importSaveAsNewSlot,
    createTheme, renameTheme, deleteTheme, submitHarvest,
    getTreeYield, buyTree, purchaseShopItem, ownsShopItem, canPurchaseShopItem, createProject, selectProject, 
    openMap, openShop, openForest, openNotebook, uploadNote, openThemeForest,
    startAction, stopTimer, toggleAction, downloadSaveFile, importSaveData, cheatAddCoins, getTreeIcon,
    renameProject, deleteProject, mergeProjects, reorderProjects, moveProjectToTheme, updateNoteTags, toggleNightMode, 
    initAuth, loginWithEmail, registerWithEmail, logout, uploadSaveToCloud, downloadSaveFromCloud,
    claimOfflineEarnings, discardOfflineEarnings, renameNote, updateNote, createSystemNote, createEssayNote, deleteNote
  }
})
