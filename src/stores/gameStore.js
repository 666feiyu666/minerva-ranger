import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '@/supabase'
import normalTreeImg from '@/assets/tree/normal_tree.png'
import willowTreeImg from '@/assets/tree/willow_tree.png'
import poplarTreeImg from '@/assets/tree/poplar_tree.png'
import magicTreeImg from '@/assets/tree/magic_tree.png'
import goldTreeImg from '@/assets/tree/gold_tree.png'

export const useGameStore = defineStore('game', () => {
  // === 1. 基础配置 (不变) ===
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
  
  const themes = ref([]) // [新增] 主题(领域)数组
  const projects = ref([]) 
  const notebook = ref([]) 
  
  const activeView = ref('dashboard')

  // === 3. 运行时状态 ===
  const activeProjectId = ref(null) 
  const runningProjectId = ref(null)
  
  const activeTreeId = ref(null)
  const isRunning = ref(false)
  const timer = ref(0)          
  
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
      id: Date.now(), projectIds: tags, title, wordCount, coins: earnedCoins, date: new Date().toLocaleString() 
    })
  }

  function renameNote(noteId, newTitle) {
    const note = notebook.value.find(n => n.id === noteId)
    if (note) note.title = newTitle
  }

  function deleteNote(noteId) {
    const index = notebook.value.findIndex(n => n.id === noteId)
    if (index !== -1) {
      const note = notebook.value[index]
      if (note.coins > 0) coins.value = Math.max(0, coins.value - note.coins)
      notebook.value.splice(index, 1)
    }
  }

  function updateNoteTags(noteId, newProjectIds) {
    const note = notebook.value.find(n => n.id === noteId)
    if (note) note.projectIds = [...newProjectIds]
  }

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

  // === 7. 管理功能 ===
  
  // [新增] 主题操作
  function createTheme(name) {
    themes.value.push({ id: `theme_${Date.now()}`, name })
  }
  
  function renameTheme(id, newName) {
    const theme = themes.value.find(t => t.id === id)
    if (theme) theme.name = newName
  }

  function deleteTheme(id) {
    projects.value.forEach(p => { if (p.themeId === id) p.themeId = null })
    themes.value = themes.value.filter(t => t.id !== id)
  }

  // [修改] 项目操作
  function createProject(name, themeId = null) { 
    const newProj = { 
        id: Date.now(), name, icon: '📁', level: 1, currentXP: 0, nextLevelXP: 100, 
        totalTrees: 0, totalTimeSpent: 0, forest: {}, themeId 
    }; 
    projects.value.push(newProj); 
    selectProject(newProj.id) 
  }

  function renameProject(id, newName) {
    const project = projects.value.find(p => p.id === id)
    if (project) project.name = newName
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

  // 移出原有的拖拽排序，目前用 themeId 进行归类，此方法可作废但暂且保留防报错
  function reorderProjects(fromIndex, toIndex) {
    // Legacy support, now we drag to themes instead
  }

  // === 8. 持久化与离线逻辑 ===
  const SAVE_KEY = 'minerva_save_v1'

  function getSaveData() {
    return {
      version: 1,
      timestamp: Date.now(),
      coins: coins.value,
      globalXP: globalXP.value,
      unlockedTreeIds: unlockedTreeIds.value,
      themes: themes.value, // [新增]
      projects: projects.value, 
      notebook: notebook.value,
      activeProjectId: activeProjectId.value,
      runningProjectId: runningProjectId.value, 
      activeTreeId: activeTreeId.value,
      isRunning: isRunning.value,
      timer: timer.value,
      isNightMode: isNightMode.value 
    }
  }

  function claimOfflineEarnings() {
    if (!offlineEarnings.value) return
    const { projectId, tree, secondsPassed, completedCycles, newTimer } = offlineEarnings.value
    const project = projects.value.find(p => p.id === projectId)
    if (project) {
        if (!project.totalTimeSpent) project.totalTimeSpent = 0
        project.totalTimeSpent += secondsPassed
        if (completedCycles > 0) {
             const oldRunning = runningProjectId.value
             runningProjectId.value = projectId
             activeTreeId.value = tree.id 
             completeCycle(completedCycles)
             runningProjectId.value = oldRunning
        }
    }
    timer.value = newTimer
    isRunning.value = true 
    startTimer()
    offlineEarnings.value = null
    saveToLocalStorage()
  }

  function discardOfflineEarnings() {
    offlineEarnings.value = null
    isRunning.value = false 
    saveToLocalStorage()
  }

  // === 9. 云同步与认证逻辑 ===
  const user = ref(null)

  async function initAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user || null
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user || null
    })
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

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) alert(error.message)
  }

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

  function saveToLocalStorage() { 
    if (!offlineEarnings.value) {
        localStorage.setItem(SAVE_KEY, JSON.stringify(getSaveData())) 
    }
  }

  function importSaveData(jsonString, silent = false) {
    try {
      const data = JSON.parse(jsonString)
      coins.value = data.coins || 0
      globalXP.value = data.globalXP || 0
      unlockedTreeIds.value = data.unlockedTreeIds || ['t1']
      
      themes.value = data.themes || [] // [新增]
      projects.value = (data.projects || []).map(p => ({ 
          ...p, themeId: p.themeId || null, forest: p.forest || {}, totalTimeSpent: p.totalTimeSpent || 0 
      }))
      
      const rawNotebook = data.notebook || []
      notebook.value = rawNotebook.map(note => ({
        ...note, projectIds: note.projectIds || (note.projectId ? [note.projectId] : [])
      }))
      
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
        
        if (secondsPassed > 30) {
          const tree = TREE_TYPES.find(t => t.id === activeTreeId.value)
          if (tree) {
             const totalTime = timer.value + secondsPassed
             const cycleTime = tree.time
             const completedCycles = Math.floor(totalTime / cycleTime)
             const remainingTime = totalTime % cycleTime
             
             offlineEarnings.value = {
                 projectId: savedRunningProjectId, tree, secondsPassed, completedCycles, newTimer: remainingTime 
             }
             runningProjectId.value = savedRunningProjectId
             isRunning.value = false 
          }
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

  // [修改] watch 列表加入 themes
  watch([coins, globalXP, unlockedTreeIds, themes, projects, notebook, activeProjectId, runningProjectId, activeTreeId, isRunning, timer, isNightMode], () => { saveToLocalStorage() }, { deep: true })
  
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
  function selectProject(id) { activeProjectId.value = id; activeView.value = 'dashboard' }
  function openShop() { activeView.value = 'shop' }
  function openForest() { activeView.value = 'forest' }
  function openNotebook() { activeView.value = 'notebook' }
  function buyTree(tree) { if (unlockedTreeIds.value.includes(tree.id)) return; if (coins.value >= tree.price) { coins.value -= tree.price; unlockedTreeIds.value.push(tree.id) } }
  function cheatAddCoins() { coins.value += 1000; globalXP.value += 1000 }

  return { 
    themes, projects, globalXP, globalLevel, globalLevelProgress, coins, unlockedTreeIds, activeView, notebook,
    activeProjectId, activeProject, runningProjectId, runningProject, 
    activeTreeId, activeTree, timer, maxTime, isRunning, progressPercentage, 
    isNightMode, TREE_TYPES, inventoryTrees,
    user, offlineEarnings,
    
    createTheme, renameTheme, deleteTheme,
    getTreeYield, buyTree, createProject, selectProject, 
    openShop, openForest, openNotebook, uploadNote,
    startAction, stopTimer, toggleAction, downloadSaveFile, importSaveData, cheatAddCoins, getTreeIcon,
    renameProject, deleteProject, reorderProjects,
    updateNoteTags,
    toggleNightMode, 
    initAuth, loginWithEmail, registerWithEmail, logout, uploadSaveToCloud, downloadSaveFromCloud,
    claimOfflineEarnings, discardOfflineEarnings, renameNote, deleteNote
  }
})