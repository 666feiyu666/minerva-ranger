export const LEGACY_SAVE_KEY = 'minerva_save_v1'
export const SAVE_INDEX_KEY = 'minerva_save_index_v1'
export const SAVE_SLOT_KEY_PREFIX = 'minerva_save_slot_'

export function getSlotStorageKey(slotId) {
  return `${SAVE_SLOT_KEY_PREFIX}${slotId}`
}
