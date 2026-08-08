import { createEmptySaveData, SAVE_DATA_VERSION } from '@/config/defaultSaveData'
import { buildSaveSummary } from '@/local-backend/domain/saveSchema'
import {
  createSlotId,
  hasBootstrappedDefaultIdentity,
  listStoredSlotIds,
  markDefaultIdentityBootstrapped,
  readLegacySaveData,
  readSaveIndex,
  readSlotData,
  removeSlotData,
  writeSaveIndex,
  writeSlotData,
} from '@/local-backend/storage/saveSlotRepository'

export { hasBootstrappedDefaultIdentity, markDefaultIdentityBootstrapped }

export function buildSaveData(snapshot) {
  return {
    version: SAVE_DATA_VERSION,
    slotId: snapshot.activeSlotId,
    slotName: snapshot.activeSlotName || '未命名身份档案',
    timestamp: Date.now(),
    coins: snapshot.coins,
    globalXP: snapshot.globalXP,
    unlockedTreeIds: snapshot.unlockedTreeIds,
    ownedBoostIds: snapshot.ownedBoostIds,
    unlockedBackgroundIds: snapshot.unlockedBackgroundIds,
    skills: snapshot.skills,
    actions: snapshot.actions,
    notebook: snapshot.notebook,
    activeView: snapshot.activeView,
    activeSkillId: snapshot.activeSkillId,
    activeActionId: snapshot.activeActionId,
    runningActionId: snapshot.runningActionId,
    activeTreeId: snapshot.activeTreeId,
    isRunning: snapshot.isRunning,
    timer: snapshot.timer,
    settledCycles: snapshot.settledCycles,
    taskTrees: snapshot.taskTrees,
    taskXP: snapshot.taskXP,
    taskStartLevel: snapshot.taskStartLevel,
    timerMode: snapshot.timerMode,
    targetDuration: snapshot.targetDuration,
    isNightMode: snapshot.isNightMode,
  }
}

export function shouldPersistActiveSlot({ activeSlotId, bootStage, offlineEarnings, isHydrating }) {
  return Boolean(activeSlotId && bootStage === 'in-game' && !offlineEarnings && !isHydrating)
}

export function createSaveSlotData(name, slotCount, initialData = null, options = {}) {
  const slotId = createSlotId()
  const slotName = name?.trim() || (slotCount === 0 ? '开发设计师' : `新身份档案 #${slotCount + 1}`)
  const slotData = initialData
    ? { ...initialData, version: SAVE_DATA_VERSION, slotId, slotName, timestamp: Date.now() }
    : createEmptySaveData(slotId, slotName, options)

  return { slotId, slotName, slotData }
}

export function persistSlotDataToRepository({
  saveIndex,
  activeSlotName,
  slotId,
  saveData,
  options = {},
}) {
  const now = new Date().toISOString()
  const nextIndex = {
    ...saveIndex,
    slots: (saveIndex.slots || []).map((slot) => ({
      ...slot,
      summary: { ...slot.summary },
    })),
  }
  const nextData = {
    ...saveData,
    version: SAVE_DATA_VERSION,
    slotId,
    slotName: options.slotName || saveData.slotName || activeSlotName || '未命名身份档案',
    timestamp: Date.now(),
  }

  writeSlotData(slotId, nextData)

  const summary = buildSaveSummary(nextData)
  const existing = nextIndex.slots.find((slot) => slot.id === slotId)
  if (existing) {
    existing.name = options.slotName || existing.name
    existing.updatedAt = now
    existing.lastPlayedAt = options.markPlayed ? now : existing.lastPlayedAt || now
    existing.summary = summary
    existing.source = existing.source || 'local'
  } else {
    nextIndex.slots.push({
      id: slotId,
      name: options.slotName || nextData.slotName || '未命名身份档案',
      createdAt: now,
      updatedAt: now,
      lastPlayedAt: now,
      source: 'local',
      summary,
    })
  }

  if (options.updateSelection !== false) {
    nextIndex.lastSelectedSlotId = slotId
  }

  writeSaveIndex(nextIndex)
  Object.assign(saveIndex, nextIndex)
  return nextData
}

export function rebuildSaveIndexFromStoredSlots() {
  const slots = []

  for (const slotId of listStoredSlotIds()) {
    try {
      const saveData = readSlotData(slotId)
      if (!saveData || typeof saveData !== 'object') continue

      const timestamp = Number(saveData.timestamp) || Date.now()
      const updatedAt = new Date(timestamp).toISOString()
      slots.push({
        id: slotId,
        name: saveData.slotName || '未命名身份档案',
        createdAt: updatedAt,
        updatedAt,
        lastPlayedAt: updatedAt,
        source: 'local',
        summary: buildSaveSummary(saveData),
      })
    } catch (error) {
      console.error(`Failed to recover local save slot ${slotId}.`, error)
    }
  }

  slots.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  return {
    version: 1,
    lastSelectedSlotId: slots[0]?.id || null,
    slots,
  }
}

export { readLegacySaveData, readSaveIndex, readSlotData, removeSlotData, writeSaveIndex }
