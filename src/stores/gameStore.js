import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '@/supabase'
import normalTreeImg from '@/assets/tree/normal_tree.png'
import willowTreeImg from '@/assets/tree/willow_tree.png'
import poplarTreeImg from '@/assets/tree/poplar_tree.png'
import magicTreeImg from '@/assets/tree/magic_tree.png'
import goldTreeImg from '@/assets/tree/gold_tree.png'

export const useGameStore = defineStore('game', () => {
  const PROJECT_BASE_XP = 100
  const PROJECT_XP_GROWTH = 1.2

  // === 1. 基础配置 ===
  const TREE_TYPES = [
    { id: 't1', name: '橡树', time: 25 * 60, xp: 100, price: 0, levelReq: 1, icon: normalTreeImg, desc: '基础树种，适合新手' },
    { id: 't2', name: '垂柳', time: 25 * 60, xp: 250, price: 500, levelReq: 5, icon: willowTreeImg, desc: '优雅的垂柳，经验丰富' },
    { id: 't3', name: '杨树', time: 25 * 60, xp: 600, price: 2500, levelReq: 15, icon: poplarTreeImg, desc: '长得像火炬，有一点' },
    { id: 't4', name: '魔法树', time: 25 * 60, xp: 1500, price: 10000, levelReq: 30, icon: magicTreeImg, desc: '传说中的魔法植物' },
    { id: 't5', name: '金钱树', time: 25 * 60, xp: 3000, price: 50000, levelReq: 50, icon: goldTreeImg, desc: '能收获金钱吗？' },
  ]

  // === 2. 玩家数据 ===
  const coins = ref(0)
  const unlockedTreeIds = ref(['t1'])
  const globalXP = ref(0)
  
  const themes = ref([]) 
  const projects = ref([]) 
  const notebook = ref([]) 
  
  const activeView = ref('dashboard')

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

  function toProjectIds(projectIds) {
    if (Array.isArray(projectIds)) return [...new Set(projectIds.filter(Boolean))]
    if (projectIds) return [projectIds]
    return []
  }

  function isSameProjectId(left, right) {
    return String(left) === String(right)
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
      note.type || (note.title?.startsWith('[植树日志]') ? 'planting' : 'ranger')
    const source = note.source || (inferredType === 'system' ? 'system' : 'user')

    return {
      ...note,
      projectIds: toProjectIds(note.projectIds || note.projectId),
      type: inferredType,
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
      alert('未记录笔记，未能获得金币！')
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

  function renameNote(noteId, newTitle) {
    const note = notebook.value.find(n => n.id === noteId)
    if (note && note.source !== 'system') {
      note.title = newTitle
      note.updatedAt = new Date().toISOString()
    }
  }

  function updateNote(noteId, payload = {}) {
    const note = notebook.value.find(n => n.id === noteId)
    if (!note || note.source === 'system') return false

    if (typeof payload.content === 'string') {
      const cleanContent = payload.content.replace(/\s/g, '')
      if (cleanContent.length <= 0) {
        alert('日志内容不能为空')
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

  // 【核心修复】：监听页面可见性变化，对抗浏览器后台休眠
  document.addEventListener('visibilitychange', () => {
    // 只有在树木正在生长时才需要补帧
    if (isRunning.value) {
      if (document.visibilityState === 'visible') {
        // 当页面重新变回可见时，强制结算在后台流失的真实物理时间
        const now = Date.now()
        const delta = (now - lastTimestamp) / 1000
        lastTimestamp = now

        if (timer.value < MAX_PLANTING_TIME) {
          const actualDelta = Math.min(delta, MAX_PLANTING_TIME - timer.value)
          timer.value += actualDelta
        }
      } else if (document.visibilityState === 'hidden') {
        // 当切到后台前，更新最后时间戳，并强制存一次档
        lastTimestamp = Date.now()
        saveToLocalStorage()
      }
    }
  })

  function gameTick() {
    if (!activeTree.value || !isRunning.value) {
      stopTimer()
      return
    }

    const now = Date.now()
    const delta = (now - lastTimestamp) / 1000
    lastTimestamp = now

    if (timer.value >= MAX_PLANTING_TIME) return

    const actualDelta = Math.min(delta, MAX_PLANTING_TIME - timer.value)

    timer.value += actualDelta
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

  function deleteProject(id) {
    if (runningProjectId.value === id) {
        stopTimer(); isRunning.value = false; runningProjectId.value = null; timer.value = 0
    }
    if (activeProjectId.value === id) { activeProjectId.value = null; activeView.value = 'forest' }
    projects.value = projects.value.filter(p => p.id !== id)
  }

  function mergeProjects(sourceProjectId, targetProjectId) {
    if (!sourceProjectId || !targetProjectId || isSameProjectId(sourceProjectId, targetProjectId)) return false

    const sourceProject = projects.value.find(p => isSameProjectId(p.id, sourceProjectId))
    const targetProject = projects.value.find(p => isSameProjectId(p.id, targetProjectId))
    if (!sourceProject || !targetProject) return false

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
        `迁移日志：${migratedLogCount} 条`
      ].join('\n')
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

  // === 8. 持久化与离线逻辑 ===
  const SAVE_KEY = 'minerva_save_v1'

  function getSaveData() {
    return {
      version: 1, timestamp: Date.now(), coins: coins.value, globalXP: globalXP.value, unlockedTreeIds: unlockedTreeIds.value,
      themes: themes.value, projects: projects.value, notebook: notebook.value,
      activeProjectId: activeProjectId.value, runningProjectId: runningProjectId.value, activeTreeId: activeTreeId.value,
      isRunning: isRunning.value, timer: timer.value, isNightMode: isNightMode.value 
    }
  }

  function claimOfflineEarnings() {
    if (!offlineEarnings.value) return
    const { newTimer } = offlineEarnings.value
    timer.value = newTimer 
    
    if (timer.value < MAX_PLANTING_TIME) {
      isRunning.value = true 
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
    if (error) { alert('登录失败: ' + error.message); return false }
    return true
  }

  async function registerWithEmail(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { alert('注册失败: ' + error.message); return false }
    alert('注册成功！已自动登录。')
    return true
  }

  async function logout() { const { error } = await supabase.auth.signOut(); if (error) alert(error.message) }

  async function uploadSaveToCloud() {
    if (!user.value) return alert('请先登录！')
    const saveData = getSaveData()
    const { error } = await supabase.from('game_saves').upsert({ 
        user_id: user.value.id, save_data: saveData, updated_at: new Date()
      }, { onConflict: 'user_id' })
    if (error) { console.error(error); alert('云端保存失败: ' + error.message) } 
    else { alert('☁️ 云端保存成功！') }
  }

  async function downloadSaveFromCloud() {
    if (!user.value) return alert('请先登录！')
    const { data, error } = await supabase.from('game_saves').select('save_data').single()
    if (error) { console.error(error); alert('读取云存档失败: ' + error.message); return }
    if (data && data.save_data) { importSaveData(JSON.stringify(data.save_data)) }
  }

  function saveToLocalStorage() { if (!offlineEarnings.value) { localStorage.setItem(SAVE_KEY, JSON.stringify(getSaveData())) } }

  function importSaveData(jsonString, silent = false) {
    try {
      const data = JSON.parse(jsonString)
      coins.value = data.coins || 0
      globalXP.value = data.globalXP || 0
      unlockedTreeIds.value = data.unlockedTreeIds || ['t1']
      themes.value = (data.themes || []).map(t => ({
        ...t,
        x: t.x !== undefined ? t.x : Math.floor(Math.random() * 70) + 15,
        y: t.y !== undefined ? t.y : Math.floor(Math.random() * 70) + 15
      }))
      projects.value = (data.projects || []).map(normalizeProject)
      const rawNotebook = data.notebook || []
      notebook.value = rawNotebook.map(normalizeNote)
      
      activeProjectId.value = data.activeProjectId || null
      const savedRunningProjectId = data.runningProjectId || data.activeProjectId || null 
      activeTreeId.value = data.activeTreeId || null
      timer.value = data.timer || 0
      isNightMode.value = data.isNightMode || false 
      
      const wasRunning = data.isRunning || false
      const lastSave = data.timestamp || Date.now()

      if (wasRunning && activeTreeId.value && savedRunningProjectId) {
        const now = Date.now()
        const secondsPassed = Math.floor((now - lastSave) / 1000)
        
        if (secondsPassed > 60) {
          // 超过 1 分钟（60秒），走正常的离线收益弹窗逻辑
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
          // 【核心修复】：如果是 1 分钟以内的刷新、页面意外重载或短暂切后台
          // 默默把时间补上，直接继续运行，不弹窗打断用户的沉浸感
          timer.value += secondsPassed
          if (timer.value > MAX_PLANTING_TIME) timer.value = MAX_PLANTING_TIME
          runningProjectId.value = savedRunningProjectId
          startTimer() // 重新启动计时器
        } else {
          runningProjectId.value = savedRunningProjectId
          startTimer()
        }
      } else {
        isRunning.value = false
        runningProjectId.value = savedRunningProjectId
      }
      if (!silent) { saveToLocalStorage() }
    } catch (e) { console.error(e); if (!silent) alert('存档损坏') }
  }

  watch([coins, globalXP, unlockedTreeIds, themes, projects, notebook, activeProjectId, runningProjectId, activeTreeId, isRunning, timer, isNightMode], () => { saveToLocalStorage() }, { deep: true })
  
  function loadGame() { const saved = localStorage.getItem(SAVE_KEY); if (saved) importSaveData(saved, true) }
  loadGame()

  function getTreeIcon(id) { const t = TREE_TYPES.find(tree => tree.id === id); return t ? t.icon : '❓' }
  function downloadSaveFile() { 
    const data = getSaveData(); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `minerva_save_${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }
  function selectProject(id) { activeProjectId.value = id; activeView.value = 'dashboard' }
  function openShop() { activeView.value = 'shop' }
  function openNotebook() { activeView.value = 'notebook' }
  function buyTree(tree) { if (unlockedTreeIds.value.includes(tree.id)) return; if (coins.value >= tree.price) { coins.value -= tree.price; unlockedTreeIds.value.push(tree.id) } }
  function cheatAddCoins() { coins.value += 1000; globalXP.value += 1000 }

  return { 
    themes, projects, globalXP, globalLevel, globalLevelProgress, coins, unlockedTreeIds, activeView, notebook,
    activeProjectId, activeProject, runningProjectId, runningProject, activeThemeId,
    activeTreeId, activeTree, timer, maxTime, isRunning, progressPercentage, 
    isNightMode, TREE_TYPES, inventoryTrees,
    user, offlineEarnings, MAX_PLANTING_TIME, 
    
    createTheme, renameTheme, deleteTheme, submitHarvest,
    getTreeYield, buyTree, createProject, selectProject, 
    openMap, openShop, openForest, openNotebook, uploadNote, openThemeForest,
    startAction, stopTimer, toggleAction, downloadSaveFile, importSaveData, cheatAddCoins, getTreeIcon,
    renameProject, deleteProject, mergeProjects, reorderProjects, moveProjectToTheme, updateNoteTags, toggleNightMode, 
    initAuth, loginWithEmail, registerWithEmail, logout, uploadSaveToCloud, downloadSaveFromCloud,
    claimOfflineEarnings, discardOfflineEarnings, renameNote, updateNote, createSystemNote, deleteNote
  }
})
