import { createEmptySaveData } from '@/config/defaultSaveData'
import { buildSaveSummary } from '@/local-backend/domain/saveSchema'
import {
  createSlotId,
  readLegacySaveData,
  readSaveIndex,
  readSlotData,
  removeSlotData,
  writeSaveIndex,
  writeSlotData
} from '@/local-backend/storage/saveSlotRepository'

export function buildSaveData(snapshot) {
  return {
    version: 2,
    slotId: snapshot.activeSlotId,
    slotName: snapshot.activeSlotName || '未命名存档',
    timestamp: Date.now(),
    coins: snapshot.coins,
    globalXP: snapshot.globalXP,
    unlockedTreeIds: snapshot.unlockedTreeIds,
    ownedBoostIds: snapshot.ownedBoostIds,
    unlockedBackgroundIds: snapshot.unlockedBackgroundIds,
    themes: snapshot.themes,
    projects: snapshot.projects,
    notebook: snapshot.notebook,
    activeView: snapshot.activeView,
    activeThemeId: snapshot.activeThemeId,
    activeProjectId: snapshot.activeProjectId,
    runningProjectId: snapshot.runningProjectId,
    activeTreeId: snapshot.activeTreeId,
    isRunning: snapshot.isRunning,
    timer: snapshot.timer,
    isNightMode: snapshot.isNightMode
  }
}

export function shouldPersistActiveSlot({
  activeSlotId,
  bootStage,
  offlineEarnings,
  isHydrating
}) {
  return Boolean(activeSlotId && bootStage === 'in-game' && !offlineEarnings && !isHydrating)
}

export function createSaveSlotData(name, slotCount, initialData = null) {
  const slotId = createSlotId()
  const slotName = name?.trim() || `新存档 #${slotCount + 1}`
  const slotData = initialData
    ? { ...initialData, version: 2, slotId, slotName, timestamp: Date.now() }
    : createEmptySaveData(slotId, slotName)

  return { slotId, slotName, slotData }
}

export function persistSlotDataToRepository({
  saveIndex,
  activeSlotName,
  slotId,
  saveData,
  options = {}
}) {
  const now = new Date().toISOString()
  const nextData = {
    ...saveData,
    version: 2,
    slotId,
    slotName: options.slotName || saveData.slotName || activeSlotName || '未命名存档',
    timestamp: Date.now()
  }

  writeSlotData(slotId, nextData)

  const summary = buildSaveSummary(nextData)
  const existing = saveIndex.slots.find(slot => slot.id === slotId)
  if (existing) {
    existing.name = options.slotName || existing.name
    existing.updatedAt = now
    existing.lastPlayedAt = options.markPlayed ? now : existing.lastPlayedAt || now
    existing.summary = summary
    existing.source = existing.source || 'local'
  } else {
    saveIndex.slots.push({
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
    saveIndex.lastSelectedSlotId = slotId
  }

  writeSaveIndex(saveIndex)
  return nextData
}

export {
  readLegacySaveData,
  readSaveIndex,
  readSlotData,
  removeSlotData,
  writeSaveIndex
}
