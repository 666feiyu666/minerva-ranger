import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useGameSnapshot } from '@/application/persistence/gameSnapshot'
import { alertDialog } from '@/composables/dialogService'
import { normalizeSaveIndex, validateSaveDataShape } from '@/local-backend/domain/saveSchema'
import {
  createSaveSlotData,
  hasBootstrappedDefaultIdentity,
  markDefaultIdentityBootstrapped,
  persistSlotDataToRepository,
  readSaveIndex,
  readSlotData,
  rebuildSaveIndexFromStoredSlots,
  removeSlotData,
  shouldPersistActiveSlot,
  writeSaveIndex,
} from '@/local-backend/services/saveService'
import { useAppStore } from './appStore'
import { useNotebookStore } from './notebookStore'
import { useMapStore } from './mapStore'
import { usePlantingStore } from './plantingStore'
import { usePlayerStore } from './playerStore'
import { useActionStore } from './actionStore'

export const useSaveStore = defineStore('save', () => {
  const appStore = useAppStore()
  const playerStore = usePlayerStore()
  const actionStore = useActionStore()
  const notebookStore = useNotebookStore()
  const mapStore = useMapStore()
  const plantingStore = usePlantingStore()
  const snapshot = useGameSnapshot()

  const bootStage = ref('slot-select')
  const saveIndex = ref({ lastSelectedSlotId: null, slots: [] })
  const activeSlotId = ref(null)
  const isHydrating = ref(false)
  const persistenceError = ref(null)
  let notifiedPersistenceError = null

  const saveSlots = computed(() => saveIndex.value.slots || [])
  const activeSlotMeta = computed(
    () => saveSlots.value.find((slot) => slot.id === activeSlotId.value) || null,
  )

  function clearPersistenceError() {
    persistenceError.value = null
    notifiedPersistenceError = null
  }

  function reportPersistenceError(action, error) {
    const message = error?.message || String(error)
    persistenceError.value = { action, message, timestamp: Date.now() }
    const notificationKey = `${action}:${message}`
    if (notifiedPersistenceError !== notificationKey) {
      notifiedPersistenceError = notificationKey
      void alertDialog(`${action}失败：${message}`, { title: '本地存档错误' })
    }
    return false
  }

  function saveSaveIndex() {
    try {
      writeSaveIndex(saveIndex.value)
      clearPersistenceError()
      return true
    } catch (error) {
      return reportPersistenceError('保存存档索引', error)
    }
  }

  function loadSaveIndex() {
    try {
      const index = readSaveIndex()
      saveIndex.value = index ? normalizeSaveIndex(index) : normalizeSaveIndex()
      clearPersistenceError()
    } catch (error) {
      const rebuiltIndex = rebuildSaveIndexFromStoredSlots()
      saveIndex.value = normalizeSaveIndex(rebuiltIndex)
      if (saveSaveIndex()) {
        void alertDialog(`存档索引无法读取，已从 ${saveSlots.value.length} 个本地存档中重建。`, {
          title: '本地存档已恢复',
        })
      } else {
        reportPersistenceError('读取存档索引', error)
      }
    }
    return saveIndex.value
  }

  function updateSlotMeta(slotId, updates = {}) {
    const slot = saveSlots.value.find((item) => item.id === slotId)
    if (!slot) return null
    Object.assign(slot, updates)
    return slot
  }

  function persistSlotData(slotId, saveData, options = {}) {
    try {
      const result = persistSlotDataToRepository({
        saveIndex: saveIndex.value,
        activeSlotName: activeSlotMeta.value?.name,
        slotId,
        saveData,
        options,
      })
      clearPersistenceError()
      return result
    } catch (error) {
      reportPersistenceError('保存本地存档', error)
      return null
    }
  }

  function getSaveData() {
    return snapshot.createGameSnapshot({
      activeSlotId: activeSlotId.value,
      activeSlotName: activeSlotMeta.value?.name,
    })
  }

  function resetGameState() {
    snapshot.resetGameSnapshot()
  }

  function applySaveData(data, silent = false) {
    try {
      isHydrating.value = true
      snapshot.hydrateGameSnapshot(data)
      if (!silent) saveToLocalStorage()
      return true
    } catch (error) {
      console.error(error)
      if (!silent) void alertDialog('存档损坏', { title: '读取失败' })
      return false
    } finally {
      isHydrating.value = false
    }
  }

  function saveActiveSlot(markPlayed = false) {
    if (!activeSlotId.value) return false
    return Boolean(
      persistSlotData(activeSlotId.value, getSaveData(), {
        markPlayed,
        slotName: activeSlotMeta.value?.name,
      }),
    )
  }

  function saveToLocalStorage() {
    if (
      !shouldPersistActiveSlot({
        activeSlotId: activeSlotId.value,
        bootStage: bootStage.value,
        offlineEarnings: plantingStore.offlineEarnings,
        isHydrating: isHydrating.value,
      })
    ) {
      return false
    }
    return saveActiveSlot(false)
  }

  function flushRuntimeState() {
    if (
      !activeSlotId.value ||
      bootStage.value !== 'in-game' ||
      plantingStore.offlineEarnings ||
      isHydrating.value
    ) {
      return false
    }
    return saveActiveSlot(false)
  }

  plantingStore.configurePersistenceAdapter({
    persist: saveToLocalStorage,
    flush: flushRuntimeState,
  })
  mapStore.configurePersistenceAdapter({ persist: saveActiveSlot })

  function createSaveSlot(name, initialData = null, options = {}) {
    const { slotId, slotName, slotData } = createSaveSlotData(
      name,
      saveSlots.value.length,
      initialData,
      options,
    )
    const persisted = persistSlotData(slotId, slotData, { markPlayed: false, slotName })
    if (!persisted) return null
    return slotId
  }

  function renameSaveSlot(slotId, newName) {
    const trimmed = newName?.trim()
    if (!trimmed || !saveSlots.value.some((item) => item.id === slotId)) return false
    try {
      const saveData = readSlotData(slotId)
      if (!saveData) return false
      const persisted = persistSlotData(
        slotId,
        { ...saveData, slotName: trimmed },
        { slotName: trimmed, updateSelection: false },
      )
      if (!persisted) return false
    } catch (error) {
      return reportPersistenceError('重命名身份', error)
    }
    return true
  }

  function moveSaveSlot(slotId, direction) {
    const currentIndex = saveSlots.value.findIndex((slot) => slot.id === slotId)
    const targetIndex = currentIndex + direction
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= saveSlots.value.length) return false
    const nextSlots = [...saveSlots.value]
    const [movedSlot] = nextSlots.splice(currentIndex, 1)
    nextSlots.splice(targetIndex, 0, movedSlot)
    const nextIndex = { ...saveIndex.value, slots: nextSlots }
    try {
      writeSaveIndex(nextIndex)
      saveIndex.value = nextIndex
      clearPersistenceError()
      return true
    } catch (error) {
      return reportPersistenceError('调整身份顺序', error)
    }
  }

  function deleteSaveSlot(slotId) {
    const nextIndex = {
      ...saveIndex.value,
      slots: saveSlots.value.filter((slot) => slot.id !== slotId),
    }
    if (nextIndex.lastSelectedSlotId === slotId) {
      nextIndex.lastSelectedSlotId = nextIndex.slots[0]?.id || null
    }
    try {
      writeSaveIndex(nextIndex)
      removeSlotData(slotId)
      saveIndex.value = nextIndex
      clearPersistenceError()
    } catch (error) {
      return reportPersistenceError('删除身份', error)
    }
    if (activeSlotId.value === slotId) {
      activeSlotId.value = null
      resetGameState()
      bootStage.value = 'slot-select'
    }
    return true
  }

  function loadSlot(slotId) {
    const previousActiveSlotId = activeSlotId.value
    try {
      const data = readSlotData(slotId)
      if (!data) return false
      const validation = validateSaveDataShape(data)
      if (!validation.ok) throw new Error(validation.error)
      activeSlotId.value = slotId
      if (applySaveData(data, true)) {
        clearPersistenceError()
        return true
      }
    } catch (error) {
      reportPersistenceError('读取本地存档', error)
    }
    activeSlotId.value = previousActiveSlotId
    return false
  }

  function enterSlot(slotId) {
    if (activeSlotId.value && bootStage.value === 'in-game') saveActiveSlot(true)
    if (!loadSlot(slotId)) return false
    bootStage.value = 'in-game'
    updateSlotMeta(slotId, { lastPlayedAt: new Date().toISOString() })
    saveIndex.value.lastSelectedSlotId = slotId
    saveSaveIndex()
    if (!plantingStore.offlineEarnings) saveActiveSlot(true)
    return true
  }

  function exitToSaveSelection() {
    if (activeSlotId.value) saveActiveSlot(true)
    bootStage.value = 'slot-select'
    plantingStore.stopTimer()
  }

  function importSaveData(jsonString, options = {}) {
    const {
      silent = false,
      targetSlotId = activeSlotId.value,
      createNewSlot = false,
      slotName = null,
    } = options
    try {
      const data = JSON.parse(jsonString)
      const validation = validateSaveDataShape(data)
      if (!validation.ok) throw new Error(validation.error)
      if (createNewSlot) return createSaveSlot(slotName || data.slotName || data.name, data)
      if (!targetSlotId) return false
      const targetMeta = saveSlots.value.find((slot) => slot.id === targetSlotId)
      const effectiveName = targetMeta?.name || slotName || data.slotName
      const persisted = persistSlotData(
        targetSlotId,
        { ...data, slotId: targetSlotId, slotName: effectiveName },
        { markPlayed: false, slotName: effectiveName, updateSelection: false },
      )
      if (!persisted) return false
      if (activeSlotId.value === targetSlotId) {
        applySaveData({ ...data, slotId: targetSlotId, slotName: effectiveName }, silent)
      }
      return targetSlotId
    } catch (error) {
      console.error(error)
      if (!silent) void alertDialog('存档损坏', { title: '导入失败' })
      return false
    }
  }

  function importSaveAsNewSlot(jsonString, slotName = null) {
    return importSaveData(jsonString, { createNewSlot: true, slotName })
  }

  function initSaveSystem() {
    loadSaveIndex()
    if (!hasBootstrappedDefaultIdentity()) {
      const defaultSlotReady =
        saveSlots.value.length > 0 ||
        Boolean(createSaveSlot('开发设计师', null, { includeDefaultSkills: true }))
      if (defaultSlotReady) markDefaultIdentityBootstrapped()
    }
    if (!activeSlotId.value) resetGameState()
    bootStage.value = 'slot-select'
  }

  function downloadSaveFile(slotId = activeSlotId.value) {
    if (!slotId) return
    let data
    try {
      data = slotId === activeSlotId.value ? getSaveData() : readSlotData(slotId)
    } catch (error) {
      reportPersistenceError('导出身份备份', error)
      return
    }
    if (!data) return
    const slotName =
      saveSlots.value.find((slot) => slot.id === slotId)?.name || data.slotName || 'save'
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `minerva_${slotName}_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  watch(
    [
      () => playerStore.coins,
      () => playerStore.globalXP,
      () => playerStore.unlockedTreeIds,
      () => playerStore.ownedBoostIds,
      () => playerStore.unlockedBackgroundIds,
      () => actionStore.skills,
      () => actionStore.actions,
      () => notebookStore.notebook,
      () => mapStore.mapState,
      () => appStore.activeView,
      () => actionStore.activeSkillId,
      () => actionStore.activeActionId,
      () => plantingStore.runningActionId,
      () => plantingStore.activeTreeId,
      () => plantingStore.isRunning,
      () => appStore.isNightMode,
    ],
    saveToLocalStorage,
    { deep: true },
  )

  return {
    bootStage,
    saveIndex,
    saveSlots,
    activeSlotId,
    activeSlotMeta,
    persistenceError,
    isHydrating,
    initSaveSystem,
    createSaveSlot,
    renameSaveSlot,
    moveSaveSlot,
    deleteSaveSlot,
    enterSlot,
    exitToSaveSelection,
    saveActiveSlot,
    saveToLocalStorage,
    importSaveData,
    importSaveAsNewSlot,
    downloadSaveFile,
    getSaveData,
    saveSaveIndex,
    clearPersistenceError,
  }
})
