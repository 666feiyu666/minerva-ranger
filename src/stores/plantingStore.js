import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { RUNNING_SAVE_INTERVAL_MS, TIMER_TICK_INTERVAL_MS } from '@/config/gameBalance'
import { TREE_TYPES } from '@/config/treeCatalog'
import { isSameActionId } from '@/local-backend/domain/actionModel'
import {
  applyCompletedTreeCycles,
  buildPlantingNoteInput,
  getFinishedCycles,
  getTreeYield as getTreeYieldFromHarvestService,
} from '@/local-backend/services/harvestService'
import {
  DEFAULT_COUNTUP_DURATION,
  PLANTING_MODES,
  getPlantingModeLabel,
  getTaskTimeState,
  validatePlantingMode,
} from '@/local-backend/services/plantingModeService.mjs'
import { getRunningTimerDelta } from '@/local-backend/services/timerService'
import { useNotebookStore } from './notebookStore'
import { useMapStore } from './mapStore'
import { usePlayerStore } from './playerStore'
import { useActionStore } from './actionStore'

const EMPTY_PERSISTENCE_ADAPTER = Object.freeze({
  persist: () => false,
  flush: () => false,
})

export const usePlantingStore = defineStore('planting', () => {
  const playerStore = usePlayerStore()
  const actionStore = useActionStore()
  const notebookStore = useNotebookStore()
  const mapStore = useMapStore()

  const runningActionId = ref(null)
  const activeTreeId = ref(null)
  const isRunning = ref(false)
  const timer = ref(0)
  const settledCycles = ref(0)
  const taskTrees = ref(0)
  const taskXP = ref(0)
  const taskStartLevel = ref(null)
  const taskSessionId = ref(null)
  const taskStartedAt = ref(null)
  const timerMode = ref(PLANTING_MODES.COUNTUP)
  const targetDuration = ref(DEFAULT_COUNTUP_DURATION)
  const offlineEarnings = ref(null)

  let timerInterval = null
  let lastTimestamp = 0
  let lastRuntimeSaveAt = 0
  let runtimeAttached = false
  let persistenceAdapter = EMPTY_PERSISTENCE_ADAPTER

  const runningAction = computed(() =>
    actionStore.actions.find((action) => action.id === runningActionId.value),
  )
  const activeTree = computed(() => TREE_TYPES.find((tree) => tree.id === activeTreeId.value))
  const maxTime = computed(() => activeTree.value?.time || 25 * 60)
  const taskLimit = computed(() => targetDuration.value || DEFAULT_COUNTUP_DURATION)
  const timerModeLabel = computed(() => getPlantingModeLabel(timerMode.value))
  const taskTimeState = computed(() =>
    getTaskTimeState({
      mode: timerMode.value,
      elapsedDuration: timer.value,
      targetDuration: taskLimit.value,
    }),
  )
  const progressPercentage = computed(() => {
    if (actionStore.activeActionId !== runningActionId.value || !activeTree.value) return 0
    const currentCycleTime = Math.max(0, timer.value - settledCycles.value * maxTime.value)
    return Math.min((currentCycleTime / maxTime.value) * 100, 100)
  })

  function configurePersistenceAdapter(adapter = {}) {
    persistenceAdapter = {
      persist: adapter.persist || EMPTY_PERSISTENCE_ADAPTER.persist,
      flush: adapter.flush || EMPTY_PERSISTENCE_ADAPTER.flush,
    }
  }

  function persistRuntime() {
    return persistenceAdapter.persist()
  }

  function getTreeYield(tree, action) {
    return getTreeYieldFromHarvestService(tree, action)
  }

  function completeCycle(times = 1, actionId = runningActionId.value) {
    const targetAction = actionStore.actions.find((action) => action.id === actionId)
    if (!targetAction || !activeTree.value) return null

    const result = applyCompletedTreeCycles(targetAction, activeTree.value, times)
    if (result) {
      playerStore.addGlobalXP(result.totalXP)
      mapStore.addTreeBalance(activeTree.value.id, result.totalTrees)
      settledCycles.value += Math.max(0, Math.floor(times))
      taskTrees.value += result.totalTrees
      taskXP.value += result.totalXP
    }
    return result
  }

  function settleFinishedCycles() {
    if (!activeTree.value || !runningAction.value) return null
    const finishedCycles = getFinishedCycles(timer.value, activeTree.value)
    const pendingCycles = Math.max(0, finishedCycles - settledCycles.value)
    return pendingCycles > 0 ? completeCycle(pendingCycles, runningActionId.value) : null
  }

  function syncRunningTimer(now = Date.now()) {
    const result = getRunningTimerDelta({
      isRunning: isRunning.value,
      hasActiveTree: Boolean(activeTree.value),
      timer: timer.value,
      lastTimestamp,
      now,
      maxTime: taskLimit.value,
    })
    lastTimestamp = result.nextTimestamp
    timer.value = result.nextTimer
    const settlement = settleFinishedCycles()
    const reachedLimit = taskTimeState.value.reachedLimit
    if (reachedLimit) stopTimer()

    if (
      settlement ||
      reachedLimit ||
      (result.actualDelta > 0 && now - lastRuntimeSaveAt >= RUNNING_SAVE_INTERVAL_MS)
    ) {
      lastRuntimeSaveAt = now
      persistRuntime()
    }
    return result.actualDelta
  }

  function gameTick() {
    if (!activeTree.value || !isRunning.value) {
      stopTimer()
      return
    }
    syncRunningTimer()
    if (taskTimeState.value.reachedLimit) stopTimer()
  }

  function startTimer() {
    if (isRunning.value || taskTimeState.value.reachedLimit) return
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
    if (actionStore.activeActionId !== runningActionId.value) return
    if (isRunning.value) stopTimer()
    else if (activeTreeId.value && runningActionId.value) startTimer()
  }

  function startAction(treeId, options = {}) {
    const tree = TREE_TYPES.find((item) => item.id === treeId)
    if (!actionStore.activeActionId || !tree || !playerStore.unlockedTreeIds.includes(treeId)) {
      return { ok: false, error: '当前行动或树种无效。' }
    }
    if (runningActionId.value) return { ok: false, error: '请先结束当前种植任务。' }

    const validation = validatePlantingMode({
      mode: options.mode || PLANTING_MODES.COUNTUP,
      targetDuration: options.targetDuration,
      cycleDuration: tree.time,
    })
    if (!validation.ok) return validation

    stopTimer()
    runningActionId.value = actionStore.activeActionId
    activeTreeId.value = treeId
    timer.value = 0
    settledCycles.value = 0
    taskTrees.value = 0
    taskXP.value = 0
    taskStartLevel.value = actionStore.activeAction?.level || 1
    taskSessionId.value = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    taskStartedAt.value = new Date().toISOString()
    timerMode.value = validation.mode
    targetDuration.value = validation.targetDuration
    startTimer()
    persistRuntime()
    return validation
  }

  function submitHarvest(content, options = {}) {
    const targetAction = runningAction.value
    if (!targetAction || !activeTree.value) return false

    settleFinishedCycles()
    const endedAt = new Date()
    const targetSkill = actionStore.skills.find((skill) => skill.id === targetAction.skillId) || null
    const noteInput = buildPlantingNoteInput({
      action: targetAction,
      skill: targetSkill,
      tree: activeTree.value,
      content,
      sessionId: taskSessionId.value,
      startedAt: taskStartedAt.value,
      endedAt: endedAt.toISOString(),
      durationSeconds: Math.floor(timer.value),
      completedCycles: settledCycles.value,
      treesEarned: taskTrees.value,
      xpEarned: taskXP.value,
      endReason: options.endReason || 'manual',
    })
    if (noteInput) notebookStore.createNote(noteInput)
    clearPlantingTask()
    persistRuntime()
    return true
  }

  function clearPlantingTask() {
    stopTimer()
    runningActionId.value = null
    activeTreeId.value = null
    timer.value = 0
    settledCycles.value = 0
    taskTrees.value = 0
    taskXP.value = 0
    taskStartLevel.value = null
    taskSessionId.value = null
    taskStartedAt.value = null
    timerMode.value = PLANTING_MODES.COUNTUP
    targetDuration.value = DEFAULT_COUNTUP_DURATION
    offlineEarnings.value = null
  }

  function moveRunningAction(sourceActionId, targetActionId) {
    if (isSameActionId(runningActionId.value, sourceActionId)) {
      runningActionId.value = targetActionId
    }
  }

  function cancelRunningAction(actionId) {
    if (!isSameActionId(runningActionId.value, actionId)) return false
    clearPlantingTask()
    return true
  }

  function claimOfflineEarnings() {
    if (!offlineEarnings.value) return
    timer.value = offlineEarnings.value.newTimer
    settleFinishedCycles()
    if (timer.value < taskLimit.value) startTimer()
    else isRunning.value = false
    offlineEarnings.value = null
    persistRuntime()
  }

  function hydratePlantingState(data = {}) {
    stopTimer()
    activeTreeId.value = data.activeTreeId || null

    const hasExplicitRunningAction = Boolean(data.runningActionId && activeTreeId.value)
    const hasLegacyRunningTask = Boolean(
      !data.runningActionId &&
      data.activeActionId &&
      activeTreeId.value &&
      (data.isRunning || Number(data.timer) > 0),
    )
    const candidateRunningActionId = hasExplicitRunningAction
      ? data.runningActionId
      : hasLegacyRunningTask
        ? data.activeActionId
        : null
    const savedRunningActionId = actionStore.actions.some((action) =>
      isSameActionId(action.id, candidateRunningActionId),
    )
      ? candidateRunningActionId
      : null

    timer.value = data.timer || 0
    settledCycles.value = data.settledCycles || 0
    taskTrees.value = data.taskTrees || 0
    taskXP.value = data.taskXP || 0
    taskStartLevel.value = data.taskStartLevel || null
    taskSessionId.value = data.taskSessionId || null
    taskStartedAt.value = data.taskStartedAt || null

    const savedTree = TREE_TYPES.find((tree) => tree.id === activeTreeId.value)
    const savedModeValidation = validatePlantingMode({
      mode: data.timerMode || PLANTING_MODES.COUNTUP,
      targetDuration: data.targetDuration,
      cycleDuration: savedTree?.time || 25 * 60,
    })
    timerMode.value = savedModeValidation.ok ? savedModeValidation.mode : PLANTING_MODES.COUNTUP
    targetDuration.value = savedModeValidation.ok
      ? savedModeValidation.targetDuration
      : DEFAULT_COUNTUP_DURATION

    const wasRunning = data.isRunning || false
    const lastSave = data.timestamp || Date.now()
    offlineEarnings.value = null
    runningActionId.value = savedRunningActionId

    if (!savedRunningActionId) clearPlantingTask()
    if (savedRunningActionId && taskStartLevel.value === null) {
      taskStartLevel.value = runningAction.value?.level || 1
    }
    if (savedRunningActionId && !taskSessionId.value) {
      taskSessionId.value = `legacy_${savedRunningActionId}_${data.timestamp || Date.now()}`
    }
    if (savedRunningActionId && !taskStartedAt.value) {
      taskStartedAt.value = new Date(
        Math.max(0, (data.timestamp || Date.now()) - timer.value * 1000),
      ).toISOString()
    }
    settleFinishedCycles()

    if (wasRunning && activeTreeId.value && savedRunningActionId) {
      const now = Date.now()
      const secondsPassed = Math.floor((now - lastSave) / 1000)
      if (secondsPassed > 60) {
        const tree = TREE_TYPES.find((item) => item.id === activeTreeId.value)
        if (tree) {
          const finalTimer = Math.min(timer.value + secondsPassed, taskLimit.value)
          offlineEarnings.value = {
            actionId: savedRunningActionId,
            tree,
            secondsPassed: Math.max(0, finalTimer - timer.value),
            newTimer: finalTimer,
            mode: timerMode.value,
            targetDuration: taskLimit.value,
            completedCycles: Math.max(0, getFinishedCycles(finalTimer, tree) - settledCycles.value),
          }
          isRunning.value = false
        }
      } else if (secondsPassed > 0) {
        timer.value = Math.min(timer.value + secondsPassed, taskLimit.value)
        settleFinishedCycles()
        startTimer()
      } else {
        startTimer()
      }
    } else {
      isRunning.value = false
      runningActionId.value = savedRunningActionId
    }
  }

  function resetPlantingState() {
    clearPlantingTask()
  }

  function toPlantingSnapshot() {
    return {
      runningActionId: runningActionId.value,
      activeTreeId: activeTreeId.value,
      isRunning: isRunning.value,
      timer: timer.value,
      settledCycles: settledCycles.value,
      taskTrees: taskTrees.value,
      taskXP: taskXP.value,
      taskStartLevel: taskStartLevel.value,
      taskSessionId: taskSessionId.value,
      taskStartedAt: taskStartedAt.value,
      timerMode: timerMode.value,
      targetDuration: targetDuration.value,
    }
  }

  function handleVisibilityChange() {
    if (!isRunning.value) return
    if (document.visibilityState === 'hidden') {
      syncRunningTimer()
      persistRuntime()
    } else if (document.visibilityState === 'visible') {
      syncRunningTimer()
    }
  }

  function flushRuntimeState() {
    if (isRunning.value) syncRunningTimer()
    persistenceAdapter.flush()
  }

  function attachRuntime() {
    if (runtimeAttached) return
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', flushRuntimeState)
      window.addEventListener('beforeunload', flushRuntimeState)
    }
    runtimeAttached = true
  }

  function detachRuntime() {
    if (!runtimeAttached) return
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('pagehide', flushRuntimeState)
      window.removeEventListener('beforeunload', flushRuntimeState)
    }
    runtimeAttached = false
  }

  return {
    runningActionId,
    runningAction,
    activeTreeId,
    activeTree,
    isRunning,
    timer,
    settledCycles,
    taskTrees,
    taskXP,
    taskStartLevel,
    taskSessionId,
    taskStartedAt,
    timerMode,
    targetDuration,
    offlineEarnings,
    maxTime,
    taskLimit,
    timerModeLabel,
    taskTimeState,
    progressPercentage,
    PLANTING_MODES,
    getTreeYield,
    startAction,
    startTimer,
    stopTimer,
    toggleAction,
    submitHarvest,
    settleFinishedCycles,
    clearPlantingTask,
    moveRunningAction,
    cancelRunningAction,
    claimOfflineEarnings,
    hydratePlantingState,
    resetPlantingState,
    toPlantingSnapshot,
    configurePersistenceAdapter,
    attachRuntime,
    detachRuntime,
  }
})
