import { LEGACY_SAVE_KEY, SAVE_INDEX_KEY, getSlotStorageKey } from '@/config/storageKeys'
import { readJson, removeItem, writeJson } from './localStorageClient'

export function createSlotId() {
  return `slot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function readSaveIndex() {
  return readJson(SAVE_INDEX_KEY)
}

export function writeSaveIndex(index) {
  writeJson(SAVE_INDEX_KEY, index)
}

export function readSlotData(slotId) {
  return readJson(getSlotStorageKey(slotId))
}

export function writeSlotData(slotId, saveData) {
  writeJson(getSlotStorageKey(slotId), saveData)
}

export function removeSlotData(slotId) {
  removeItem(getSlotStorageKey(slotId))
}

export function readLegacySaveData() {
  return readJson(LEGACY_SAVE_KEY)
}
