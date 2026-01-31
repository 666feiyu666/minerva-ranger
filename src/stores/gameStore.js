import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useGameStore = defineStore('game', () => {
  // === 1. 基础配置 (不变) ===
  const TREE_TYPES = [
    { id: 't1', name: '橡树', time: 25 * 60, xp: 100, price: 0, levelReq: 1, icon: '🌳', desc: '基础树种，适合新手' },
    { id: 't2', name: '垂柳', time: 25 * 60, xp: 250, price: 500, levelReq: 5, icon: '🌲', desc: '优雅的垂柳，经验丰富' },
    { id: 't3', name: '红豆杉', time: 25 * 60, xp: 600, price: 2500, levelReq: 15, icon: '🌴', desc: '稀有树木，极高收益' },
    { id: 't4', name: '魔法树', time: 25 * 60, xp: 1500, price: 10000, levelReq: 30, icon: '✨', desc: '传说中的魔法植物' },
    { id: 't5', name: '水晶树', time: 25 * 60, xp: 3000, price: 50000, levelReq: 50, icon: '💎', desc: '由纯净能量构成的树' },
  ]

  // === 2. 玩家数据 ===
  const coins = ref(0)
  const unlockedTreeIds = ref(['t1'])
  const globalXP = ref(0)
  const projects = ref([]) 
  const notebook = ref([]) 
  
  const activeView = ref('dashboard')

  // === 3. 运行时状态 ===
  const activeProjectId = ref(null) 
  const runningProjectId = ref(null)
  
  const activeTreeId = ref(null)
  const isRunning = ref(false)
  const timer = ref(0)          
  
  // [新增] 夜间模式状态 (默认 false = 白天)
  const isNightMode = ref(false)

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

  // === 5. 核心逻辑 ===
  function getTreeYield(tree, project) {
    if (!project) return { trees: 0, xp: 0, multiplier: 1 }
    let multiplier = 1
    if (project.level >= 20) multiplier += 1 
    if (project.level >= 50) multiplier += 1
    if (project.level >= 99) multiplier += 1
    return { trees: 1 * multiplier, xp: tree.xp * multiplier, multiplier }
  }

  function completeCycle(times = 1) {
    if (!runningProject.value || !activeTree.value) return
    
    const yieldData = getTreeYield(activeTree.value, runningProject.value)
    
    const totalTrees = yieldData.trees * times
    const totalXP = yieldData.xp * times

    runningProject.value.totalTrees += totalTrees
    runningProject.value.currentXP += totalXP
    
    if (!runningProject.value.forest) runningProject.value.forest = {}
    if (!runningProject.value.forest[activeTree.value.id]) runningProject.value.forest[activeTree.value.id] = 0
    runningProject.value.forest[activeTree.value.id] += totalTrees

    while (runningProject.value.currentXP >= runningProject.value.nextLevelXP) {
      runningProject.value.level++
      runningProject.value.currentXP -= runningProject.value.nextLevelXP
      runningProject.value.nextLevelXP = Math.floor(runningProject.value.nextLevelXP * 1.2)
    }

    globalXP.value += totalXP
  }

  function uploadNote(title, content, projectIds = []) {
    const cleanContent = content.replace(/\s/g, '')
    const wordCount = cleanContent.length
    const earnedCoins = Math.floor(wordCount / 10)
    if (earnedCoins <= 0) { alert("笔记内容太短了！"); return }
    
    coins.value += earnedCoins
    
    const tags = Array.isArray(projectIds) ? projectIds : (projectIds ? [projectIds] : [])

    notebook.value.unshift({ 
      id: Date.now(), 
      projectIds: tags, 
      title, 
      wordCount, 
      coins: earnedCoins, 
      date: new Date().toLocaleString() 
    })
  }

  function updateNoteTags(noteId, newProjectIds) {
    const note = notebook.value.find(n => n.id === noteId)
    if (note) {
        note.projectIds = [...newProjectIds]
    }
  }

  // [新增] 切换日夜模式
  function toggleNightMode() {
    isNightMode.value = !isNightMode.value
  }

  // === 6. 计时器与动作控制 ===
  let timerInterval = null
  let lastTimestamp = 0

  function gameTick() {
    if (!activeTree.value || !isRunning.value) {
      stopTimer()
      return
    }

    const now = Date.now()
    const delta = (now - lastTimestamp) / 1000
    lastTimestamp = now

    timer.value += delta

    if (runningProject.value) {
        if (!runningProject.value.totalTimeSpent) runningProject.value.totalTimeSpent = 0
        runningProject.value.totalTimeSpent += delta
    }

    if (timer.value >= activeTree.value.time) {
      const finishedCycles = Math.floor(timer.value / activeTree.value.time)
      
      if (finishedCycles > 0) {
        completeCycle(finishedCycles)
        timer.value %= activeTree.value.time
      }
    }
  }

  function startTimer() {
    if (isRunning.value) return 
    
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
      isRunning.value = false; 
      stopTimer() 
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
        activeTreeId.value = treeId; 
        timer.value = 0 
    }
    
    startTimer()
  }

  // === 7. 管理功能 ===
  function renameProject(id, newName) {
    const project = projects.value.find(p => p.id === id)
    if (project) {
        project.name = newName
    }
  }

  function deleteProject(id) {
    if (runningProjectId.value === id) {
        stopTimer()
        isRunning.value = false
        runningProjectId.value = null
        timer.value = 0
    }
    if (activeProjectId.value === id) {
        activeProjectId.value = null
        activeView.value = 'forest'
    }
    
    projects.value = projects.value.filter(p => p.id !== id)
  }

  function reorderProjects(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= projects.value.length || toIndex < 0 || toIndex >= projects.value.length) return
    if (fromIndex === toIndex) return

    const itemToMove = projects.value[fromIndex]
    projects.value.splice(fromIndex, 1)

    let insertIndex = toIndex
    if (fromIndex < toIndex) {
        insertIndex -= 1
    }

    projects.value.splice(insertIndex, 0, itemToMove)
  }

  // === 8. 持久化 ===
  const SAVE_KEY = 'minerva_save_v1'

  function getSaveData() {
    return {
      version: 1,
      timestamp: Date.now(),
      coins: coins.value,
      globalXP: globalXP.value,
      unlockedTreeIds: unlockedTreeIds.value,
      projects: projects.value, 
      notebook: notebook.value,
      activeProjectId: activeProjectId.value,
      runningProjectId: runningProjectId.value, 
      activeTreeId: activeTreeId.value,
      isRunning: isRunning.value,
      timer: timer.value,
      isNightMode: isNightMode.value // [新增] 保存日夜模式
    }
  }

  function saveToLocalStorage() { localStorage.setItem(SAVE_KEY, JSON.stringify(getSaveData())) }

  function importSaveData(jsonString, silent = false) {
    try {
      const data = JSON.parse(jsonString)
      coins.value = data.coins || 0
      globalXP.value = data.globalXP || 0
      unlockedTreeIds.value = data.unlockedTreeIds || ['t1']
      projects.value = (data.projects || []).map(p => ({ ...p, forest: p.forest || {}, totalTimeSpent: p.totalTimeSpent || 0 }))
      
      const rawNotebook = data.notebook || []
      notebook.value = rawNotebook.map(note => ({
        ...note,
        projectIds: note.projectIds || (note.projectId ? [note.projectId] : [])
      }))
      
      activeProjectId.value = data.activeProjectId || null
      runningProjectId.value = data.runningProjectId || data.activeProjectId || null 
      activeTreeId.value = data.activeTreeId || null
      timer.value = data.timer || 0
      isNightMode.value = data.isNightMode || false // [新增] 读取日夜模式
      
      const wasRunning = data.isRunning || false
      const lastSave = data.timestamp || Date.now() // 注意：这里使用了 data.timestamp 或当前时间

      if (wasRunning && activeTreeId.value && runningProjectId.value) {
        const now = Date.now()
        const secondsPassed = Math.floor((now - lastSave) / 1000)
        if (secondsPassed > 0) {
          const tree = TREE_TYPES.find(t => t.id === activeTreeId.value)
          if (tree) {
             const totalTime = timer.value + secondsPassed
             const cycleTime = tree.time
             const completedCycles = Math.floor(totalTime / cycleTime)
             const remainingTime = totalTime % cycleTime
             if (completedCycles > 0) completeCycle(completedCycles)
             timer.value = remainingTime
          }
        }
        startTimer()
      } else {
        isRunning.value = false
      }
      if (!silent) { alert('存档读取成功！'); saveToLocalStorage() }
    } catch (e) { console.error(e); if (!silent) alert('存档损坏') }
  }

  // [修改] 监听 isNightMode 的变化以自动保存
  watch([coins, globalXP, unlockedTreeIds, projects, notebook, activeProjectId, runningProjectId, activeTreeId, isRunning, timer, isNightMode], () => { saveToLocalStorage() }, { deep: true })
  
  function loadGame() { const saved = localStorage.getItem(SAVE_KEY); if (saved) importSaveData(saved, true) }
  loadGame()

  function getTreeIcon(id) { const t = TREE_TYPES.find(tree => tree.id === id); return t ? t.icon : '❓' }
  function downloadSaveFile() { 
    const data = getSaveData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `minerva_save_${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  function buyTree(tree) { if (unlockedTreeIds.value.includes(tree.id)) return; if (coins.value >= tree.price) { coins.value -= tree.price; unlockedTreeIds.value.push(tree.id) } }
  function createProject(name) { const newProj = { id: Date.now(), name, icon: '📁', level: 1, currentXP: 0, nextLevelXP: 100, totalTrees: 0, totalTimeSpent: 0, forest: {} }; projects.value.push(newProj); selectProject(newProj.id) }
  function selectProject(id) { activeProjectId.value = id; activeView.value = 'dashboard' }
  
  function openShop() { activeView.value = 'shop' }
  function openForest() { activeView.value = 'forest' }
  function openNotebook() { activeView.value = 'notebook' }
  function cheatAddCoins() { coins.value += 1000; globalXP.value += 1000 }

  return { 
    projects, globalXP, globalLevel, globalLevelProgress, coins, unlockedTreeIds, activeView, notebook,
    activeProjectId, activeProject, runningProjectId, runningProject, 
    activeTreeId, activeTree, timer, maxTime, isRunning, progressPercentage, 
    isNightMode, // 导出状态
    TREE_TYPES, inventoryTrees,
    getTreeYield, buyTree, createProject, selectProject, 
    openShop, openForest, openNotebook, uploadNote,
    startAction, stopTimer, toggleAction, downloadSaveFile, importSaveData, cheatAddCoins, getTreeIcon,
    renameProject, deleteProject, reorderProjects,
    updateNoteTags,
    toggleNightMode // 导出方法
  }
})