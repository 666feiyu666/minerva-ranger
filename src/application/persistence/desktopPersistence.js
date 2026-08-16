import {
  buildSnapshotFromStorage,
  collectBrowserEnvelope,
  createMemoryStorage,
  snapshotToEntries,
} from '@/application/persistence/snapshotStorage'
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
  return Boolean(typeof window !== 'undefined' && window.minervaDesktopPersistence?.initialize)
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
    const legacyEnvelope = collectBrowserEnvelope()
    const result = await bridge.initialize(legacyEnvelope)
    revision = Number(result.snapshot.revision) || 0
    memoryStorage = createMemoryStorage(snapshotToEntries(result.snapshot), markDirty)
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
    snapshot = buildSnapshotFromStorage(memoryStorage)
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
    memoryStorage = createMemoryStorage(snapshotToEntries(result.restored), markDirty)
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
