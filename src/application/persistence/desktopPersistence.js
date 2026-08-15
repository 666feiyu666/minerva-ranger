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
import { configureStorageClient } from '@/local-backend/storage/localStorageClient'

const statusListeners = new Set()

let bridge = null
let memoryStorage = null
let revision = 0
let dirty = false
let scheduled = false
let flushPromise = null
let lastError = null
let currentStatus = {
  mode: 'browser-localstorage',
  state: 'ready',
  revision: 0,
  error: null,
  migration: null,
}

function publishStatus(updates) {
  currentStatus = { ...currentStatus, ...updates }
  for (const listener of statusListeners) listener({ ...currentStatus })
}

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

function collectLegacyEnvelope() {
  const storage = window.localStorage
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
    saveIndex = parseJsonWithBackup(
      storage,
      SAVE_INDEX_KEY,
      SAVE_INDEX_BACKUP_KEY,
      '旧存档索引',
    )
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
    lastSelectedSlotId: repairedSlots.some(
      (slot) => slot.id === normalizedIndex.lastSelectedSlotId,
    )
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

function createMemoryStorage(initialEntries = []) {
  const values = new Map(initialEntries)
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
      values.set(String(key), String(value))
      markDirty()
    },
    removeItem(key) {
      const removed = values.delete(String(key))
      if (removed) markDirty()
    },
    clear() {
      if (values.size === 0) return
      values.clear()
      markDirty()
    },
    replace(entries) {
      values.clear()
      for (const [key, value] of entries) values.set(String(key), String(value))
    },
  }
}

function snapshotToEntries(snapshot) {
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

function readMemoryJson(key) {
  const value = memoryStorage.getItem(key)
  return value === null ? null : JSON.parse(value)
}

function buildSnapshotFromMemory() {
  const saveIndex = normalizeSaveIndex(readMemoryJson(SAVE_INDEX_KEY) || undefined)
  const slots = saveIndex.slots.map((metadata) => {
    const payload = readMemoryJson(getSlotStorageKey(metadata.id))
    if (!payload) throw new Error(`身份 ${metadata.id} 缺少内存快照。`)
    return { id: metadata.id, payload }
  })
  return {
    defaultIdentityBootstrapped: memoryStorage.getItem(DEFAULT_IDENTITY_BOOTSTRAP_KEY) === '1',
    saveIndex,
    rangerProfile: readMemoryJson(RANGER_PROFILE_KEY),
    slots,
  }
}

function markDirty() {
  if (!bridge) return
  dirty = true
  if (scheduled) return
  scheduled = true
  queueMicrotask(() => {
    scheduled = false
    void flushDesktopPersistence().catch(() => undefined)
  })
}

export function hasDesktopPersistence() {
  return Boolean(
    typeof window !== 'undefined' && window.minervaDesktopPersistence?.initialize,
  )
}

export function subscribeDesktopPersistence(listener) {
  statusListeners.add(listener)
  listener({ ...currentStatus })
  return () => statusListeners.delete(listener)
}

export function getDesktopPersistenceStatus() {
  return { ...currentStatus }
}

export async function initializeDesktopPersistence() {
  if (!hasDesktopPersistence()) return { mode: 'browser-localstorage' }
  if (bridge && memoryStorage) return { ...currentStatus }

  bridge = window.minervaDesktopPersistence
  publishStatus({ mode: 'sqlite', state: 'initializing', error: null })
  try {
    const legacyEnvelope = collectLegacyEnvelope()
    const result = await bridge.initialize(legacyEnvelope)
    revision = Number(result.snapshot.revision) || 0
    memoryStorage = createMemoryStorage(snapshotToEntries(result.snapshot))
    configureStorageClient(memoryStorage)
    dirty = false
    lastError = null
    publishStatus({
      mode: 'sqlite',
      state: 'ready',
      revision,
      error: null,
      migration: result.migration,
    })
    return result
  } catch (error) {
    lastError = error
    publishStatus({
      mode: 'sqlite',
      state: error.recoverable === false ? 'fatal' : 'degraded',
      error,
    })
    throw error
  }
}

export async function flushDesktopPersistence() {
  if (!bridge || !memoryStorage) return true
  if (flushPromise) {
    await flushPromise
    if (dirty) return flushDesktopPersistence()
    return true
  }
  if (!dirty) {
    if (lastError) throw lastError
    return true
  }

  dirty = false
  let snapshot
  try {
    snapshot = buildSnapshotFromMemory()
  } catch (error) {
    dirty = true
    lastError = error
    publishStatus({ state: 'degraded', error })
    throw error
  }
  publishStatus({ state: 'saving', error: null })
  flushPromise = bridge
    .commitSnapshot({ snapshot, expectedRevision: revision })
    .then((result) => {
      revision = Number(result.revision)
      lastError = null
      publishStatus({ state: 'ready', revision, error: null })
      return true
    })
    .catch((error) => {
      dirty = true
      lastError = error
      publishStatus({
        state: error.recoverable === false ? 'fatal' : 'degraded',
        error,
      })
      throw error
    })
    .finally(() => {
      flushPromise = null
    })

  await flushPromise
  if (dirty) return flushDesktopPersistence()
  return true
}

export async function reloadDesktopPersistence() {
  if (!bridge || !memoryStorage) return null
  const snapshot = await bridge.loadSnapshot()
  revision = Number(snapshot.revision) || 0
  memoryStorage.replace(snapshotToEntries(snapshot))
  dirty = false
  lastError = null
  publishStatus({ state: 'ready', revision, error: null })
  return snapshot
}

export async function createDesktopBackup(reason) {
  if (!bridge) return null
  await flushDesktopPersistence()
  return bridge.createBackup(reason)
}

export async function listDesktopBackups() {
  return bridge ? bridge.listBackups() : []
}

export async function restoreDesktopBackup(filename) {
  if (!bridge) return null
  const result = await bridge.restoreBackup(filename)
  revision = Number(result.restored.revision) || 0
  if (memoryStorage) {
    memoryStorage.replace(snapshotToEntries(result.restored))
  } else {
    memoryStorage = createMemoryStorage(snapshotToEntries(result.restored))
    configureStorageClient(memoryStorage)
  }
  dirty = false
  lastError = null
  publishStatus({ state: 'ready', revision, error: null })
  return result
}

export async function getDesktopDiagnostics() {
  return bridge ? bridge.getDiagnostics() : null
}
