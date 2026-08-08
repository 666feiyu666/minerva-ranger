export const DEFAULT_IDENTITY_BOOTSTRAP_KEY = 'minerva_default_identity_bootstrapped'
export const SAVE_INDEX_KEY = 'minerva_save_index'
export const SAVE_INDEX_BACKUP_KEY = 'minerva_save_index_backup'
export const SAVE_SLOT_KEY_PREFIX = 'minerva_slot_'
export const SAVE_SLOT_BACKUP_SUFFIX = '_backup'

export function getSlotStorageKey(slotId) {
  return `${SAVE_SLOT_KEY_PREFIX}${slotId}`
}

export function getSlotBackupStorageKey(slotId) {
  return `${getSlotStorageKey(slotId)}${SAVE_SLOT_BACKUP_SUFFIX}`
}
