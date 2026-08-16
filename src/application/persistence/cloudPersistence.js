import {
  buildSnapshotFromStorage,
  createMemoryStorage,
  snapshotToEntries,
} from '@/application/persistence/snapshotStorage'
import { configureStorageClient } from '@/local-backend/storage/localStorageClient'

const SAVE_DEBOUNCE_MS = 1200
const statusListeners = new Set()

let memoryStorage = null
let revision = 0
let dirty = false
let initialized = false
let saveTimer = null
let flushPromise = null
let pendingRequestId = null
let onlineListenerInstalled = false
let lastError = null
let currentStatus = {
  mode: 'cloud-d1',
  state: 'initializing',
  revision: 0,
  user: null,
  updatedAt: null,
  error: null,
}

function publishStatus(updates) {
  currentStatus = { ...currentStatus, ...updates }
  for (const listener of statusListeners) listener({ ...currentStatus })
}

function createCloudError(payload, status) {
  const details = payload?.error || {}
  const error = new Error(details.message || `云端请求失败（HTTP ${status}）。`)
  error.code = details.code || 'CLOUD_REQUEST_FAILED'
  error.recoverable = details.recoverable !== false
  error.status = status
  error.details = details.details || null
  return error
}

async function requestJson(path, options = {}) {
  const developmentHeaders =
    import.meta.env?.DEV && import.meta.env?.VITE_DEV_CLOUD_USER
      ? { 'X-Minerva-Dev-User': import.meta.env.VITE_DEV_CLOUD_USER }
      : {}
  let response
  try {
    response = await fetch(path, {
      cache: 'no-store',
      credentials: 'same-origin',
      ...options,
      headers: {
        ...developmentHeaders,
        ...options.headers,
      },
    })
  } catch (cause) {
    const error = new Error('无法连接云端，请检查网络后重试。', { cause })
    error.code = 'NETWORK_ERROR'
    error.recoverable = true
    throw error
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) throw createCloudError(payload, response.status)
  return payload
}

function scheduleFlush() {
  if (saveTimer !== null) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    saveTimer = null
    void flushCloudPersistence().catch(() => undefined)
  }, SAVE_DEBOUNCE_MS)
}

function markDirty() {
  if (!initialized) return
  dirty = true
  if (currentStatus.state === 'ready') publishStatus({ state: 'pending' })
  scheduleFlush()
}

function emptySnapshot() {
  return {
    defaultIdentityBootstrapped: false,
    saveIndex: { lastSelectedSlotId: null, slots: [] },
    rangerProfile: null,
    slots: [],
  }
}

function installOnlineRetry() {
  if (onlineListenerInstalled || typeof window === 'undefined') return
  onlineListenerInstalled = true
  window.addEventListener('online', () => {
    if (!dirty || currentStatus.state === 'conflict') return
    publishStatus({ state: 'pending', error: null })
    scheduleFlush()
  })
}

export function hasCloudPersistence() {
  return Boolean(
    typeof window !== 'undefined' &&
    !window.minervaDesktopPersistence?.initialize &&
    import.meta.env?.VITE_PERSISTENCE_MODE === 'cloud',
  )
}

export function subscribeCloudPersistence(listener) {
  statusListeners.add(listener)
  listener({ ...currentStatus })
  return () => statusListeners.delete(listener)
}

export function getCloudPersistenceStatus() {
  return { ...currentStatus }
}

export async function initializeCloudPersistence() {
  if (!hasCloudPersistence()) return { mode: 'browser-localstorage' }
  if (initialized && memoryStorage) return { ...currentStatus }

  publishStatus({ state: 'initializing', error: null })
  try {
    const result = await requestJson('/api/snapshot')
    revision = Number(result.revision) || 0
    memoryStorage = createMemoryStorage(
      snapshotToEntries(result.snapshot || emptySnapshot()),
      markDirty,
    )
    configureStorageClient(memoryStorage)
    dirty = false
    initialized = true
    lastError = null
    pendingRequestId = null
    installOnlineRetry()
    publishStatus({
      state: 'ready',
      revision,
      user: result.user || null,
      updatedAt: result.updatedAt || null,
      error: null,
    })
    return result
  } catch (error) {
    lastError = error
    publishStatus({
      state:
        error.code === 'NETWORK_ERROR'
          ? 'offline'
          : error.recoverable === false
            ? 'fatal'
            : 'degraded',
      error,
    })
    throw error
  }
}

export async function flushCloudPersistence() {
  if (!initialized || !memoryStorage) return true
  if (saveTimer !== null) {
    window.clearTimeout(saveTimer)
    saveTimer = null
  }
  if (flushPromise) {
    await flushPromise
    if (dirty) return flushCloudPersistence()
    return true
  }
  if (!dirty) {
    if (lastError) throw lastError
    return true
  }

  let snapshot
  try {
    snapshot = buildSnapshotFromStorage(memoryStorage)
  } catch (error) {
    lastError = error
    publishStatus({ state: 'degraded', error })
    throw error
  }

  dirty = false
  pendingRequestId ||= crypto.randomUUID()
  publishStatus({ state: 'saving', error: null })
  flushPromise = requestJson('/api/snapshot', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': pendingRequestId,
      'If-Match': String(revision),
    },
    body: JSON.stringify({ schemaVersion: 1, snapshot }),
  })
    .then((result) => {
      revision = Number(result.revision)
      lastError = null
      pendingRequestId = null
      publishStatus({
        state: 'ready',
        revision,
        updatedAt: result.updatedAt || new Date().toISOString(),
        error: null,
      })
      return true
    })
    .catch((error) => {
      dirty = true
      lastError = error
      publishStatus({
        state:
          error.code === 'STALE_REVISION'
            ? 'conflict'
            : error.code === 'NETWORK_ERROR'
              ? 'offline'
              : error.recoverable === false
                ? 'fatal'
                : 'degraded',
        error,
      })
      throw error
    })
    .finally(() => {
      flushPromise = null
    })

  await flushPromise
  if (dirty) return flushCloudPersistence()
  return true
}

export async function reloadCloudPersistence() {
  if (!initialized || !memoryStorage) return null
  publishStatus({ state: 'initializing', error: null })
  const result = await requestJson('/api/snapshot')
  revision = Number(result.revision) || 0
  memoryStorage.replace(snapshotToEntries(result.snapshot || emptySnapshot()))
  dirty = false
  lastError = null
  pendingRequestId = null
  publishStatus({
    state: 'ready',
    revision,
    user: result.user || currentStatus.user,
    updatedAt: result.updatedAt || null,
    error: null,
  })
  return result.snapshot
}
