import {
  DEFAULT_IDENTITY_BOOTSTRAP_KEY,
  RANGER_PROFILE_BACKUP_KEY,
  RANGER_PROFILE_KEY,
  SAVE_INDEX_BACKUP_KEY,
  SAVE_INDEX_KEY,
  SAVE_SLOT_BACKUP_SUFFIX,
  SAVE_SLOT_KEY_PREFIX,
  getSlotBackupStorageKey,
  getSlotStorageKey,
} from '@/config/storageKeys'
import {
  readJsonWithBackup,
  readText,
  listStorageKeys,
  removeItem,
  writeText,
  writeJsonWithBackup,
} from './localStorageClient'

export function hasBootstrappedDefaultIdentity() {
  return readText(DEFAULT_IDENTITY_BOOTSTRAP_KEY) === '1'
}

export function markDefaultIdentityBootstrapped() {
  writeText(DEFAULT_IDENTITY_BOOTSTRAP_KEY, '1')
}

export function createSlotId() {
  return `slot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function readSaveIndex() {
  return readJsonWithBackup(SAVE_INDEX_KEY, SAVE_INDEX_BACKUP_KEY)
}

export function writeSaveIndex(index) {
  writeJsonWithBackup(SAVE_INDEX_KEY, SAVE_INDEX_BACKUP_KEY, index)
}

export function readRangerProfile() {
  return readJsonWithBackup(RANGER_PROFILE_KEY, RANGER_PROFILE_BACKUP_KEY)
}

export function writeRangerProfile(profile) {
  writeJsonWithBackup(RANGER_PROFILE_KEY, RANGER_PROFILE_BACKUP_KEY, profile)
}

export function readSlotData(slotId) {
  return readJsonWithBackup(getSlotStorageKey(slotId), getSlotBackupStorageKey(slotId))
}

export function writeSlotData(slotId, saveData) {
  writeJsonWithBackup(getSlotStorageKey(slotId), getSlotBackupStorageKey(slotId), saveData)
}

export function removeSlotData(slotId) {
  removeItem(getSlotStorageKey(slotId))
  removeItem(getSlotBackupStorageKey(slotId))
}

export function listStoredSlotIds() {
  const slotIds = []

  for (const key of listStorageKeys()) {
    if (!key?.startsWith(SAVE_SLOT_KEY_PREFIX) || key.endsWith(SAVE_SLOT_BACKUP_SUFFIX)) {
      continue
    }
    slotIds.push(key.slice(SAVE_SLOT_KEY_PREFIX.length))
  }

  return slotIds
}
