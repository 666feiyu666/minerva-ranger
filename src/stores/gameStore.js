import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { alertDialog } from '@/composables/dialogService'
import { supabase } from '@/supabase'
import normalTreeImg from '@/assets/tree/normal_tree.png'
import willowTreeImg from '@/assets/tree/willow_tree.png'
import poplarTreeImg from '@/assets/tree/poplar_tree.png'
import magicTreeImg from '@/assets/tree/magic_tree.png'
import goldTreeImg from '@/assets/tree/gold_tree.png'

export const useGameStore = defineStore('game', () => {
  const PROJECT_BASE_XP = 100
  const PROJECT_XP_GROWTH = 1.2
  const LEGACY_SAVE_KEY = 'minerva_save_v1'
  const SAVE_INDEX_KEY = 'minerva_save_index_v1'
  const SAVE_SLOT_KEY_PREFIX = 'minerva_save_slot_'

  // === 1. 基础配置 ===
  const TREE_TYPES = [
    { id: 't1', name: '橡树', time: 25 * 60, xp: 100, price: 0, levelReq: 1, icon: normalTreeImg, desc: '基础树种，适合新手' },
    { id: 't2', name: '垂柳', time: 25 * 60, xp: 250, price: 500, levelReq: 5, icon: willowTreeImg, desc: '优雅的垂柳，经验丰富' },
    { id: 't3', name: '杨树', time: 25 * 60, xp: 600, price: 2500, levelReq: 15, icon: poplarTreeImg, desc: '长得像火炬，有一点' },
    { id: 't4', name: '魔法树', time: 25 * 60, xp: 1500, price: 10000, levelReq: 30, icon: magicTreeImg, desc: '传说中的魔法植物' },
    { id: 't5', name: '金钱树', time: 25 * 60, xp: 3000, price: 50000, levelReq: 50, icon: goldTreeImg, desc: '能收获金钱吗？' },
  ]
  const SHOP_CATEGORIES = [
    {
      id: 'trees',
      name: '树种',
      eyebrow: 'Trees',
      desc: '选择适合当前阶段的树种。'
    },
    {
      id: 'boosts',
      name: '技能',
      eyebrow: 'Skills',
      desc: '提升效率的辅助道具。'
    },
    {
      id: 'backgrounds',
      name: '造景',
      eyebrow: 'Scenes',
      desc: '用于项目空间的外观装饰。'
    }
  ]
  const PREVIEW_SKILL_ITEMS = [
    {
      id: 'boost_double_coins',
      type: 'boost',
      categoryId: 'boosts',
      name: '双倍金币手册',
      desc: '提升日志收益的辅助道具。',
      price: 1200,
      levelReq: 8,
      availability: 'preview',
      iconEmoji: '📘',
      badge: '暂未开放',
      meta: [
        { label: '效果', value: '日志金币 x2' },
        { label: '持续', value: '单次任务周期' }
      ]
    },
    {
      id: 'boost_focus_lens',
      type: 'boost',
      categoryId: 'boosts',
      name: '专注透镜',
      desc: '缩短种植周期的效率道具。',
      price: 2400,
      levelReq: 16,
      availability: 'preview',
      iconEmoji: '🔍',
      badge: '暂未开放',
      meta: [
        { label: '效果', value: '成长时间 -20%' },
        { label: '定位', value: '效率型技能书' }
      ]
    }
  ]
  const PREVIEW_BACKGROUND_ITEMS = [
    {
      id: 'background_archive_room',
      type: 'background',
      categoryId: 'backgrounds',
      name: '档案室温室',
      desc: '适用于单个项目的温室造景。',
      price: 1800,
      levelReq: 10,
      availability: 'preview',
      iconEmoji: '🪟',
      badge: '暂未开放',
      meta: [
        { label: '作用域', value: '单个项目' },
        { label: '气质', value: '记录室 / 温室' }
      ]
    },
    {
      id: 'background_watchtower',
      type: 'background',
      categoryId: 'backgrounds',
      name: '巡林瞭望台',
      desc: '适用于单个项目的瞭望台造景。',
      price: 4200,
      levelReq: 20,
      availability: 'preview',
      iconEmoji: '🗼',
      badge: '暂未开放',
      meta: [
        { label: '作用域', value: '单个项目' },
        { label: '气质', value: '瞭望台 / 野外值守' }
      ]
    }
  ]

  // === 2. 玩家数据 ===
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

  // === 3. 运行时状态 ===
  const activeThemeId = ref(null)
  const activeProjectId = ref(null) 
  const runningProjectId = ref(null)
  
  const activeTreeId = ref(null)
  const isRunning = ref(false)
  const timer = ref(0)          
  
  const MAX_PLANTING_TIME = 3 * 60 * 60 // 3小时最大正向计时上限 (秒)
  
  const isNightMode = ref(false)
  const offlineEarnings = ref(null)

  // === 4. 计算属性 ===
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
  const shopItems = computed(() => {
    const treeItems = TREE_TYPES.map(tree => ({
      id: `tree_${tree.id}`,
      productId: tree.id,
      type: 'tree',
      categoryId: 'trees',
      name: tree.name,
      desc: tree.desc,
      price: tree.price,
      levelReq: tree.levelReq,
      availability: 'available',
      icon: tree.icon,
      badge: tree.levelReq <= 1 ? '基础树种' : '可购买',
      meta: [
        { label: '成长', value: `${(tree.time / 60).toFixed(0)}m` },
        { label: '收益', value: `${tree.xp} XP` }
      ]
    }))

    return [...treeItems, ...PREVIEW_SKILL_ITEMS, ...PREVIEW_BACKGROUND_ITEMS]
  })
  const shopCatalog = computed(() =>
    SHOP_CATEGORIES.map(category => ({
      ...category,
      items: shopItems.value.filter(
        item => item.categoryId === category.id && item.availability === 'available'
      )
    })).filter(category => category.items.length > 0)
  )
  const saveSlots = computed(() => saveIndex.value.slots || [])
  const activeSlotMeta = computed(() =>
    saveSlots.value.find(slot => slot.id === activeSlotId.value) || null
  )

  function ownsShopItem(item) {
    if (!item) return false
    if (item.type === 'tree') return unlockedTreeIds.value.includes(item.productId)
    if (item.type === 'boost') return ownedBoostIds.value.includes(item.id)
    if (item.type === 'background') return unlockedBackgroundIds.value.includes(item.id)
    return false
  }

  function canPurchaseShopItem(item) {
    if (!item || item.availability !== 'available') return false
    if (ownsShopItem(item)) return false
    if (globalLevel.value < (item.levelReq || 1)) return false
    if (coins.value < (item.price || 0)) return false
    return true
  }

  function toProjectIds(projectIds) {
    if (Array.isArray(projectIds)) return [...new Set(projectIds.filter(Boolean))]
    if (projectIds) return [projectIds]
    return []
  }

  function isSameProjectId(left, right) {
    return String(left) === String(right)
  }

  function getGlobalLevelFromXP(xp = 0) {
    return Math.floor(Math.sqrt((xp || 0) / 100)) + 1
  }

  function getSlotStorageKey(slotId) {
    return `${SAVE_SLOT_KEY_PREFIX}${slotId}`
  }

  function createSlotId() {
    return `slot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  function normalizeSaveIndex(index = {}) {
    return {
      version: 1,
      lastSelectedSlotId: index.lastSelectedSlotId || null,
      slots: Array.isArray(index.slots)
        ? index.slots.map(slot => ({
            id: slot.id,
            name: slot.name || '未命名存档',
            createdAt: slot.createdAt || new Date().toISOString(),
            updatedAt: slot.updatedAt || slot.createdAt || new Date().toISOString(),
            lastPlayedAt:
              slot.lastPlayedAt || slot.updatedAt || slot.createdAt || new Date().toISOString(),
            source: slot.source || 'local',
            summary: {
              globalLevel: slot.summary?.globalLevel || 1,
              globalXP: slot.summary?.globalXP || 0,
              coins: slot.summary?.coins || 0,
              projectCount: slot.summary?.projectCount || 0,
              themeCount: slot.summary?.themeCount || 0,
              totalTrees: slot.summary?.totalTrees || 0,
              noteCount: slot.summary?.noteCount || 0
            }
          }))
        : []
    }
  }

  function createEmptySaveData(slotId, slotName) {
    return {
      version: 2,
      slotId,
      slotName,
      timestamp: Date.now(),
      coins: 0,
      globalXP: 0,
      unlockedTreeIds: ['t1'],
      ownedBoostIds: [],
      unlockedBackgroundIds: ['background_default'],
      themes: [],
      projects: [],
      notebook: [],
      activeView: 'forest',
      activeProjectId: null,
      runningProjectId: null,
      activeTreeId: null,
      isRunning: false,
      timer: 0,
      isNightMode: false
    }
  }

  function buildSaveSummary(saveData = {}) {
    const projectsList = Array.isArray(saveData.projects) ? saveData.projects : []
    const themesList = Array.isArray(saveData.themes) ? saveData.themes : []
    const notebookList = Array.isArray(saveData.notebook) ? saveData.notebook : []

    return {
      globalLevel: getGlobalLevelFromXP(saveData.globalXP || 0),
      globalXP: saveData.globalXP || 0,
      coins: saveData.coins || 0,
      projectCount: projectsList.length,
      themeCount: themesList.length,
      totalTrees: projectsList.reduce((sum, project) => sum + (project.totalTrees || 0), 0),
      noteCount: notebookList.length
    }
  }

  function saveSaveIndex() {
    localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(saveIndex.value))
  }

  function loadSaveIndex() {
    const raw = localStorage.getItem(SAVE_INDEX_KEY)
    saveIndex.value = raw ? normalizeSaveIndex(JSON.parse(raw)) : normalizeSaveIndex()
    return saveIndex.value
  }

  function updateSlotMeta(slotId, updates = {}) {
    const slot = saveSlots.value.find(item => item.id === slotId)
    if (!slot) return null
    Object.assign(slot, updates)
    return slot
  }

  function persistSlotData(slotId, saveData, options = {}) {
    const now = new Date().toISOString()
    const nextData = {
      ...saveData,
      version: 2,
      slotId,
      slotName: options.slotName || saveData.slotName || activeSlotMeta.value?.name || '未命名存档',
      timestamp: Date.now()
    }

    localStorage.setItem(getSlotStorageKey(slotId), JSON.stringify(nextData))

    const summary = buildSaveSummary(nextData)
    const existing = saveSlots.value.find(slot => slot.id === slotId)
    if (existing) {
      existing.name = options.slotName || existing.name
      existing.updatedAt = now
      existing.lastPlayedAt = options.markPlayed ? now : existing.lastPlayedAt || now
      existing.summary = summary
      existing.source = existing.source || 'local'
    } else {
      saveSlots.value.push({
        id: slotId,
        name: options.slotName || nextData.slotName || '未命名存档',
        createdAt: now,
        updatedAt: now,
        lastPlayedAt: now,
        source: 'local',
        summary
      })
    }

    if (options.updateSelection !== false) {
      saveIndex.value.lastSelectedSlotId = slotId
    }
    saveSaveIndex()
    return nextData
  }

  function getProjectLevelState(totalXP = 0) {
    let level = 1
    let nextLevelXP = PROJECT_BASE_XP
    let currentXP = Math.max(0, Math.floor(totalXP))

    while (currentXP >= nextLevelXP) {
      currentXP -= nextLevelXP
      level += 1
      nextLevelXP = Math.floor(nextLevelXP * PROJECT_XP_GROWTH)
    }

    return { level, currentXP, nextLevelXP }
  }

  function deriveTotalXPFromLegacyProject(project = {}) {
    if (typeof project.totalXP === 'number' && Number.isFinite(project.totalXP)) {
      return Math.max(0, Math.floor(project.totalXP))
    }

    let totalXP = Math.max(0, Math.floor(project.currentXP || 0))
    let nextLevelXP = PROJECT_BASE_XP
    const targetLevel = Math.max(1, Math.floor(project.level || 1))

    for (let level = 1; level < targetLevel; level += 1) {
      totalXP += nextLevelXP
      nextLevelXP = Math.floor(nextLevelXP * PROJECT_XP_GROWTH)
    }

    return totalXP
  }

  function normalizeProject(project = {}) {
    const totalXP = deriveTotalXPFromLegacyProject(project)
    return {
      ...project,
      id: project.id,
      name: project.name || '未命名项目',
      icon: project.icon || '📁',
      totalXP,
      totalTrees: project.totalTrees || 0,
      totalTimeSpent: project.totalTimeSpent || 0,
      forest: project.forest || {},
      themeId: project.themeId || null,
      ...getProjectLevelState(totalXP)
    }
  }

  function normalizeNote(note = {}) {
    const createdAt = note.createdAt || note.updatedAt || new Date().toISOString()
    const content = note.content || ''
    const inferredType =
      note.type || (note.title?.startsWith('[植树日志]') ? 'planting' : 'essay')
    const normalizedType = inferredType === 'ranger' ? 'essay' : inferredType
    const source = note.source || (inferredType === 'system' ? 'system' : 'user')

    return {
      ...note,
      projectIds: toProjectIds(note.projectIds || note.projectId),
      type: normalizedType,
      source,
      eventType: note.eventType || null,
      content,
      wordCount:
        typeof note.wordCount === 'number'
          ? note.wordCount
          : content.replace(/\s/g, '').length,
      coins: note.coins || 0,
      createdAt,
      updatedAt: note.updatedAt || createdAt,
      date: note.date || new Date(createdAt).toLocaleString()
    }
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
    const cleanContent = (content || '').replace(/\s/g, '')
    const wordCount = cleanContent.length

    if (source === 'user' && wordCount <= 0) {
      void alertDialog(type === 'planting' ? '未记录笔记，未能获得金币！' : '内容不能为空', {
        title: '内容无效'
      })
      return null
    }

    const earnedCoins = awardCoins ? 10 : 0
    if (earnedCoins > 0) coins.value += earnedCoins

    const createdAt = new Date().toISOString()
    const note = normalizeNote({
      id,
      title,
      content,
      type,
      source,
      eventType,
      projectIds,
      wordCount,
      coins: earnedCoins,
      createdAt,
      updatedAt: createdAt,
      date: new Date(createdAt).toLocaleString()
    })

    notebook.value.unshift(note)
    return note
  }

  // === 5. 核心逻辑 ===
  function getTreeYield(tree, project) {
    if (!project) return { trees: 0, xp: 0, multiplier: 1 }
    let multiplier = 1
    if (project.level >= 20) multiplier += 1 
    if (project.level >= 50) multiplier += 1
    if (project.level >= 99) multiplier += 1
    return { trees: 1 * multiplier, xp: tree.xp * multiplier, multiplier }
  }

  function completeCycle(times = 1, projectId = runningProjectId.value) {
    const targetProject = projects.value.find(p => p.id === projectId)
    if (!targetProject || !activeTree.value) return

    const yieldData = getTreeYield(activeTree.value, targetProject)
    
    const totalTrees = yieldData.trees * times
    const totalXP = yieldData.xp * times

    targetProject.totalTrees += totalTrees
    targetProject.totalXP += totalXP
    Object.assign(targetProject, getProjectLevelState(targetProject.totalXP))

    if (!targetProject.forest) targetProject.forest = {}
    if (!targetProject.forest[activeTree.value.id]) targetProject.forest[activeTree.value.id] = 0
    targetProject.forest[activeTree.value.id] += totalTrees

    globalXP.value += totalXP
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
    if (note && note.source !== 'system') {
      note.title = newTitle
      note.updatedAt = new Date().toISOString()
      note.date = new Date(note.updatedAt).toLocaleString()
    }
  }

  function updateNote(noteId, payload = {}) {
    const note = notebook.value.find(n => n.id === noteId)
    if (!note || note.source === 'system') return false

    if (typeof payload.content === 'string') {
      const cleanContent = payload.content.replace(/\s/g, '')
      if (cleanContent.length <= 0) {
        void alertDialog('日志内容不能为空', {
          title: '内容无效'
        })
        return false
      }
      note.content = payload.content
      note.wordCount = cleanContent.length
    }

    if (typeof payload.title === 'string' && payload.title.trim()) {
      note.title = payload.title.trim()
    }

    if (payload.projectIds !== undefined) {
      note.projectIds = toProjectIds(payload.projectIds)
    }

    note.updatedAt = new Date().toISOString()
    note.date = new Date(note.updatedAt).toLocaleString()
    return true
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
    const index = notebook.value.findIndex(n => n.id === noteId)
    if (index !== -1) {
      const note = notebook.value[index]
      if (note.source === 'system') return false
      if (note.coins > 0) coins.value = Math.max(0, coins.value - note.coins)
      notebook.value.splice(index, 1)
      return true
    }
    return false
  }

  function updateNoteTags(noteId, newProjectIds) {
    const note = notebook.value.find(n => n.id === noteId)
    if (note && note.source !== 'system') note.projectIds = [...newProjectIds]
  }

  function toggleNightMode() {
    isNightMode.value = !isNightMode.value
  }

  // === 6. 计时器与动作控制 ===
  let timerInterval = null
  let lastTimestamp = 0

  function syncRunningTimer(now = Date.now()) {
    if (!isRunning.value || !activeTree.value) {
      lastTimestamp = now
      return 0
    }

    const delta = Math.max(0, (now - lastTimestamp) / 1000)
    lastTimestamp = now

    if (timer.value >= MAX_PLANTING_TIME) return 0

    const actualDelta = Math.min(delta, MAX_PLANTING_TIME - timer.value)
    timer.value += actualDelta
    return actualDelta
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
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(gameTick, 100)
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

    const cycleTime = activeTree.value.time
    const finishedCycles = Math.floor(timer.value / cycleTime)

    if (finishedCycles > 0) {
      completeCycle(finishedCycles, targetProject.id)
      targetProject.totalTimeSpent += timer.value

      if (content && content.trim().length > 0) {
        createNote({
          title: `[植树日志] ${targetProject.name}`,
          content,
          projectIds: [targetProject.id],
          type: 'planting',
          source: 'user'
        })
      }
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

  // === 7. 管理功能 ===
  function createTheme(name) { 
    themes.value.push({ 
      id: `theme_${Date.now()}`, 
      name,
      x: Math.floor(Math.random() * 70) + 15,
      y: Math.floor(Math.random() * 70) + 15
    }) 
  }

  function renameTheme(id, newName) { const theme = themes.value.find(t => t.id === id); if (theme) theme.name = newName }
  function deleteTheme(id) {
    projects.value.forEach(p => { if (p.themeId === id) p.themeId = null })
    themes.value = themes.value.filter(t => t.id !== id)
  }

  function createProject(name, themeId = null) { 
    const newProj = normalizeProject({
      id: Date.now(),
      name,
      icon: '📁',
      totalXP: 0,
      totalTrees: 0,
      totalTimeSpent: 0,
      forest: {},
      themeId
    })
    projects.value.push(newProj)
    selectProject(newProj.id) 
  }

  function renameProject(id, newName) { const project = projects.value.find(p => p.id === id); if (project) project.name = newName }

  function deleteProject(id, options = {}) {
    const targetProject = projects.value.find(p => isSameProjectId(p.id, id))
    if (!targetProject) return false

    const commitMessage = options.commitMessage?.trim()
    const relatedLogCount = notebook.value.filter(note =>
      normalizeNote(note).projectIds.some(projectId => isSameProjectId(projectId, id))
    ).length

    if (isSameProjectId(runningProjectId.value, id)) {
        stopTimer(); isRunning.value = false; runningProjectId.value = null; timer.value = 0
    }
    if (isSameProjectId(activeProjectId.value, id)) { activeProjectId.value = null; activeView.value = 'forest' }
    projects.value = projects.value.filter(p => !isSameProjectId(p.id, id))

    createSystemNote({
      title: '[系统日志] 项目已删除',
      eventType: 'project_delete',
      content: [
        '系统记录：项目删除完成。',
        `删除项目：${targetProject.name}`,
        `删除前树木：${targetProject.totalTrees || 0} 棵`,
        `删除前时长：${Math.floor(targetProject.totalTimeSpent || 0)} 秒`,
        `删除前经验：${deriveTotalXPFromLegacyProject(targetProject)} XP`,
        `关联日志：${relatedLogCount} 条`,
        commitMessage ? `用户说明：${commitMessage}` : null
      ]
        .filter(Boolean)
        .join('\n')
    })

    return true
  }

  function mergeProjects(sourceProjectId, targetProjectId, options = {}) {
    if (!sourceProjectId || !targetProjectId || isSameProjectId(sourceProjectId, targetProjectId)) return false

    const sourceProject = projects.value.find(p => isSameProjectId(p.id, sourceProjectId))
    const targetProject = projects.value.find(p => isSameProjectId(p.id, targetProjectId))
    if (!sourceProject || !targetProject) return false
    const commitMessage = options.commitMessage?.trim()

    targetProject.totalTrees += sourceProject.totalTrees || 0
    targetProject.totalTimeSpent += sourceProject.totalTimeSpent || 0
    targetProject.totalXP =
      deriveTotalXPFromLegacyProject(targetProject) +
      deriveTotalXPFromLegacyProject(sourceProject)
    Object.assign(targetProject, getProjectLevelState(targetProject.totalXP))

    const mergedForest = { ...targetProject.forest }
    Object.entries(sourceProject.forest || {}).forEach(([treeId, count]) => {
      mergedForest[treeId] = (mergedForest[treeId] || 0) + count
    })
    targetProject.forest = mergedForest

    let migratedLogCount = 0
    notebook.value = notebook.value.map(note => {
      const normalized = normalizeNote(note)
      if (!normalized.projectIds.some(projectId => isSameProjectId(projectId, sourceProjectId))) return normalized

      migratedLogCount += 1
      normalized.projectIds = [
        ...new Set(
          normalized.projectIds.map(projectId =>
            isSameProjectId(projectId, sourceProjectId) ? targetProject.id : projectId
          )
        )
      ]
      return normalized
    })

    if (isSameProjectId(activeProjectId.value, sourceProjectId)) activeProjectId.value = targetProject.id
    if (isSameProjectId(runningProjectId.value, sourceProjectId)) runningProjectId.value = targetProject.id

    projects.value = projects.value.filter(p => !isSameProjectId(p.id, sourceProjectId))

    createSystemNote({
      title: '[系统日志] 项目已合并',
      projectIds: [targetProjectId],
      eventType: 'project_merge',
      content: [
        `系统记录：项目合并完成。`,
        `源项目：${sourceProject.name}`,
        `目标项目：${targetProject.name}`,
        `迁移树木：${sourceProject.totalTrees || 0} 棵`,
        `迁移时长：${Math.floor(sourceProject.totalTimeSpent || 0)} 秒`,
        `迁移经验：${deriveTotalXPFromLegacyProject(sourceProject)} XP`,
        `迁移日志：${migratedLogCount} 条`,
        commitMessage ? `用户说明：${commitMessage}` : null
      ]
        .filter(Boolean)
        .join('\n')
    })

    return true
  }

  function reorderProjects(sourceProjectId, targetProjectId, position = 'before') {
    if (!sourceProjectId || !targetProjectId || isSameProjectId(sourceProjectId, targetProjectId)) return false

    const nextProjects = [...projects.value]
    const sourceIndex = nextProjects.findIndex(project => isSameProjectId(project.id, sourceProjectId))
    const targetIndex = nextProjects.findIndex(project => isSameProjectId(project.id, targetProjectId))
    if (sourceIndex === -1 || targetIndex === -1) return false

    const [movedProject] = nextProjects.splice(sourceIndex, 1)
    const targetProject = nextProjects.find(project => isSameProjectId(project.id, targetProjectId))
    if (!movedProject || !targetProject) return false

    movedProject.themeId = targetProject.themeId || null

    const insertIndex =
      nextProjects.findIndex(project => isSameProjectId(project.id, targetProjectId)) +
      (position === 'after' ? 1 : 0)

    nextProjects.splice(insertIndex, 0, movedProject)
    projects.value = nextProjects
    return true
  }

  function moveProjectToTheme(projectId, themeId = null) {
    const nextProjects = [...projects.value]
    const sourceIndex = nextProjects.findIndex(project => isSameProjectId(project.id, projectId))
    if (sourceIndex === -1) return false

    const [movedProject] = nextProjects.splice(sourceIndex, 1)
    if (!movedProject) return false

    movedProject.themeId = themeId || null

    const lastThemeIndex = (() => {
      if (!themeId) {
        return nextProjects.reduce(
          (index, project, currentIndex) => (!project.themeId ? currentIndex : index),
          -1
        )
      }

      return nextProjects.reduce(
        (index, project, currentIndex) => (project.themeId === themeId ? currentIndex : index),
        -1
      )
    })()

    nextProjects.splice(lastThemeIndex + 1, 0, movedProject)
    projects.value = nextProjects
    return true
  }

  function getSaveData() {
    return {
      version: 2,
      slotId: activeSlotId.value,
      slotName: activeSlotMeta.value?.name || '未命名存档',
      timestamp: Date.now(),
      coins: coins.value,
      globalXP: globalXP.value,
      unlockedTreeIds: unlockedTreeIds.value,
      ownedBoostIds: ownedBoostIds.value,
      unlockedBackgroundIds: unlockedBackgroundIds.value,
      themes: themes.value, projects: projects.value, notebook: notebook.value,
      activeView: activeView.value,
      activeProjectId: activeProjectId.value, runningProjectId: runningProjectId.value, activeTreeId: activeTreeId.value,
      isRunning: isRunning.value, timer: timer.value, isNightMode: isNightMode.value 
    }
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

  // === 9. 云同步与认证逻辑 ===
  const user = ref(null)

  async function initAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user || null
    supabase.auth.onAuthStateChange((_event, session) => { user.value = session?.user || null })
  }

  async function loginWithEmail(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      void alertDialog('登录失败: ' + error.message, {
        title: '登录失败'
      })
      return false
    }
    return true
  }

  async function registerWithEmail(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      void alertDialog('注册失败: ' + error.message, {
        title: '注册失败'
      })
      return false
    }
    void alertDialog('注册成功！已自动登录。', {
      title: '注册成功'
    })
    return true
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      void alertDialog(error.message, {
        title: '退出失败'
      })
    }
  }

  async function uploadSaveToCloud() {
    if (!user.value) {
      void alertDialog('请先登录！', {
        title: '未登录'
      })
      return false
    }
    const saveData = getSaveData()
    const { error } = await supabase.from('game_saves').upsert({ 
        user_id: user.value.id, save_data: saveData, updated_at: new Date()
      }, { onConflict: 'user_id' })
    if (error) {
      console.error(error)
      void alertDialog('云端保存失败: ' + error.message, {
        title: '同步失败'
      })
    } else {
      void alertDialog('☁️ 云端保存成功！', {
        title: '同步成功'
      })
    }
  }

  async function downloadSaveFromCloud() {
    if (!user.value) {
      void alertDialog('请先登录！', {
        title: '未登录'
      })
      return false
    }
    const { data, error } = await supabase.from('game_saves').select('save_data').single()
    if (error) {
      console.error(error)
      void alertDialog('读取云存档失败: ' + error.message, {
        title: '读取失败'
      })
      return
    }
    if (data && data.save_data) { importSaveData(JSON.stringify(data.save_data)) }
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
      !activeSlotId.value ||
      bootStage.value !== 'in-game' ||
      offlineEarnings.value ||
      isHydrating.value
    ) {
      return
    }
    saveActiveSlot(false)
  }

  function createSaveSlot(name, initialData = null) {
    const slotId = createSlotId()
    const slotName = name?.trim() || `新存档 #${saveSlots.value.length + 1}`
    const slotData = initialData
      ? { ...initialData, version: 2, slotId, slotName, timestamp: Date.now() }
      : createEmptySaveData(slotId, slotName)

    persistSlotData(slotId, slotData, { markPlayed: false, slotName })
    return slotId
  }

  function renameSaveSlot(slotId, newName) {
    const trimmed = newName?.trim()
    if (!trimmed) return false

    const slot = updateSlotMeta(slotId, { name: trimmed, updatedAt: new Date().toISOString() })
    if (!slot) return false

    const raw = localStorage.getItem(getSlotStorageKey(slotId))
    if (raw) {
      const saveData = JSON.parse(raw)
      persistSlotData(slotId, { ...saveData, slotName: trimmed }, { slotName: trimmed, updateSelection: false })
    } else {
      saveSaveIndex()
    }
    return true
  }

  function deleteSaveSlot(slotId) {
    localStorage.removeItem(getSlotStorageKey(slotId))
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
    return true
  }

  function loadSlot(slotId) {
    const raw = localStorage.getItem(getSlotStorageKey(slotId))
    if (!raw) return false

    const data = JSON.parse(raw)
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

    const legacyRaw = localStorage.getItem(LEGACY_SAVE_KEY)
    if (!legacyRaw) return

    try {
      const legacyData = JSON.parse(legacyRaw)
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
    [coins, globalXP, unlockedTreeIds, ownedBoostIds, unlockedBackgroundIds, themes, projects, notebook, activeView, activeProjectId, runningProjectId, activeTreeId, isRunning, timer, isNightMode],
    () => { saveToLocalStorage() },
    { deep: true }
  )

  function getTreeIcon(id) { const t = TREE_TYPES.find(tree => tree.id === id); return t ? t.icon : '❓' }
  function downloadSaveFile(slotId = activeSlotId.value) { 
    if (!slotId) return

    const data =
      slotId === activeSlotId.value
        ? getSaveData()
        : JSON.parse(localStorage.getItem(getSlotStorageKey(slotId)) || 'null')
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
    user, offlineEarnings, MAX_PLANTING_TIME, 
    
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
