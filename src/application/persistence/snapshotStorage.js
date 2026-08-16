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
import { buildSaveSummary, normalizeSaveIndex } from '@/local-backend/domain/saveSchema'

function parseJsonWithBackup(storage, key, backupKey, label) {
  const primary = storage.getItem(key)
  if (primary === null) return null
  try {
    return JSON.parse(primary)
  } catch (primaryError) {
    const backupValue = storage.getItem(backupKey)
    if (backupValue === null) {
      throw new Error(`${label}损坏且没有可用备份。`, { cause: primaryError })
    }
    try {
      return JSON.parse(backupValue)
    } catch (backupError) {
      throw new Error(`${label}及其备份均已损坏。`, { cause: backupError })
    }
  }
}

function listNativeSlotIds(storage) {
  const ids = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (!key?.startsWith(SAVE_SLOT_KEY_PREFIX) || key.endsWith(SAVE_SLOT_BACKUP_SUFFIX)) continue
    ids.push(key.slice(SAVE_SLOT_KEY_PREFIX.length))
  }
  return [...new Set(ids)]
}

export function collectBrowserEnvelope(storage = window.localStorage) {
  const slotIds = listNativeSlotIds(storage)
  const slots = slotIds.map((slotId) => {
    const payload = parseJsonWithBackup(
      storage,
      getSlotStorageKey(slotId),
      getSlotBackupStorageKey(slotId),
      `旧身份 ${slotId}`,
    )
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error(`旧身份 ${slotId} 不是有效对象。`)
    }
    return { id: slotId, payload: { ...payload, slotId } }
  })

  let saveIndex
  try {
    saveIndex = parseJsonWithBackup(storage, SAVE_INDEX_KEY, SAVE_INDEX_BACKUP_KEY, '旧存档索引')
  } catch {
    saveIndex = null
  }
  const normalizedIndex = normalizeSaveIndex(saveIndex || undefined)
  const metadataById = new Map(normalizedIndex.slots.map((slot) => [slot.id, slot]))
  const timestamp = new Date().toISOString()
  const repairedSlots = slots.map(({ id, payload }) => {
    const stored = metadataById.get(id)
    const updatedAt = new Date(Number(payload.timestamp) || Date.now()).toISOString()
    return {
      id,
      name: stored?.name || payload.slotName || '未命名身份',
      createdAt: stored?.createdAt || updatedAt,
      updatedAt: stored?.updatedAt || updatedAt,
      lastPlayedAt: stored?.lastPlayedAt || updatedAt,
      summary: stored?.summary || buildSaveSummary(payload),
    }
  })
  const repairedIndex = {
    ...normalizedIndex,
    lastSelectedSlotId: repairedSlots.some((slot) => slot.id === normalizedIndex.lastSelectedSlotId)
      ? normalizedIndex.lastSelectedSlotId
      : repairedSlots[0]?.id || null,
    slots: repairedSlots,
  }

  let rangerProfile = null
  try {
    rangerProfile = parseJsonWithBackup(
      storage,
      RANGER_PROFILE_KEY,
      RANGER_PROFILE_BACKUP_KEY,
      '旧巡林官档案',
    )
  } catch {
    // Existing recovery semantics rebuild a damaged global profile from slots.
  }

  const relevantKeys = [
    DEFAULT_IDENTITY_BOOTSTRAP_KEY,
    SAVE_INDEX_KEY,
    SAVE_INDEX_BACKUP_KEY,
    RANGER_PROFILE_KEY,
    RANGER_PROFILE_BACKUP_KEY,
  ]
  const hasLegacyData =
    slotIds.length > 0 || relevantKeys.some((key) => storage.getItem(key) !== null)

  return {
    collectedAt: timestamp,
    hasLegacyData,
    snapshot: {
      defaultIdentityBootstrapped: storage.getItem(DEFAULT_IDENTITY_BOOTSTRAP_KEY) === '1',
      saveIndex: repairedIndex,
      rangerProfile,
      slots,
    },
  }
}

export function createMemoryStorage(initialEntries = [], onDirty = () => undefined) {
  const values = new Map(initialEntries)
  const shouldTrack = (key) =>
    key === DEFAULT_IDENTITY_BOOTSTRAP_KEY ||
    key === SAVE_INDEX_KEY ||
    key === RANGER_PROFILE_KEY ||
    (key.startsWith(SAVE_SLOT_KEY_PREFIX) && !key.endsWith(SAVE_SLOT_BACKUP_SUFFIX))
  return {
    get length() {
      return values.size
    },
    key(index) {
      return [...values.keys()][index] ?? null
    },
    getItem(key) {
      return values.has(String(key)) ? values.get(String(key)) : null
    },
    setItem(key, value) {
      const normalizedKey = String(key)
      const normalizedValue = String(value)
      if (values.get(normalizedKey) === normalizedValue) return
      values.set(normalizedKey, normalizedValue)
      if (shouldTrack(normalizedKey)) onDirty()
    },
    removeItem(key) {
      const normalizedKey = String(key)
      const removed = values.delete(normalizedKey)
      if (removed && shouldTrack(normalizedKey)) onDirty()
    },
    clear() {
      if (values.size === 0) return
      const hadTrackedValues = [...values.keys()].some(shouldTrack)
      values.clear()
      if (hadTrackedValues) onDirty()
    },
    replace(entries) {
      values.clear()
      for (const [key, value] of entries) values.set(String(key), String(value))
    },
  }
}

export function snapshotToEntries(snapshot = {}) {
  const entries = []
  if (snapshot.saveIndex) entries.push([SAVE_INDEX_KEY, JSON.stringify(snapshot.saveIndex)])
  if (snapshot.rangerProfile) {
    entries.push([RANGER_PROFILE_KEY, JSON.stringify(snapshot.rangerProfile)])
  }
  if (snapshot.defaultIdentityBootstrapped) {
    entries.push([DEFAULT_IDENTITY_BOOTSTRAP_KEY, '1'])
  }
  for (const slot of snapshot.slots || []) {
    entries.push([getSlotStorageKey(slot.id), JSON.stringify(slot.payload)])
  }
  return entries
}

export function buildSnapshotFromStorage(storage) {
  const readJson = (key) => {
    const value = storage.getItem(key)
    return value === null ? null : JSON.parse(value)
  }
  const saveIndex = normalizeSaveIndex(readJson(SAVE_INDEX_KEY) || undefined)
  const slots = saveIndex.slots.map((metadata) => {
    const payload = readJson(getSlotStorageKey(metadata.id))
    if (!payload) throw new Error(`身份 ${metadata.id} 缺少内存快照。`)
    return { id: metadata.id, payload }
  })
  return {
    defaultIdentityBootstrapped: storage.getItem(DEFAULT_IDENTITY_BOOTSTRAP_KEY) === '1',
    saveIndex,
    rangerProfile: readJson(RANGER_PROFILE_KEY),
    slots,
  }
}
