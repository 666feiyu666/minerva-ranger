import {
  createDesktopBackup,
  flushDesktopPersistence,
  hasDesktopPersistence,
  initializeDesktopPersistence,
  listDesktopBackups,
  reloadDesktopPersistence,
  restoreDesktopBackup,
  subscribeDesktopPersistence,
} from '@/application/persistence/desktopPersistence'
import {
  flushCloudPersistence,
  hasCloudPersistence,
  initializeCloudPersistence,
  reloadCloudPersistence,
  subscribeCloudPersistence,
} from '@/application/persistence/cloudPersistence'

export function getPersistenceMode() {
  if (hasDesktopPersistence()) return 'sqlite'
  if (hasCloudPersistence()) return 'cloud-d1'
  return 'browser-localstorage'
}

export function hasManagedPersistence() {
  return getPersistenceMode() !== 'browser-localstorage'
}

export function subscribePersistence(listener) {
  if (hasDesktopPersistence()) return subscribeDesktopPersistence(listener)
  if (hasCloudPersistence()) return subscribeCloudPersistence(listener)
  listener({
    mode: 'browser-localstorage',
    state: 'ready',
    revision: 0,
    user: null,
    environment: 'local',
    updatedAt: null,
    error: null,
  })
  return () => undefined
}

export function initializePersistence() {
  if (hasDesktopPersistence()) return initializeDesktopPersistence()
  if (hasCloudPersistence()) return initializeCloudPersistence()
  return Promise.resolve({ mode: 'browser-localstorage' })
}

export function flushPersistenceRuntime() {
  if (hasDesktopPersistence()) return flushDesktopPersistence()
  if (hasCloudPersistence()) return flushCloudPersistence()
  return Promise.resolve(true)
}

export function reloadPersistence() {
  if (hasDesktopPersistence()) return reloadDesktopPersistence()
  if (hasCloudPersistence()) return reloadCloudPersistence()
  return Promise.resolve(null)
}

export function createPersistenceRuntimeBackup(reason) {
  return hasDesktopPersistence() ? createDesktopBackup(reason) : Promise.resolve(null)
}

export function listPersistenceRuntimeBackups() {
  return hasDesktopPersistence() ? listDesktopBackups() : Promise.resolve([])
}

export function restorePersistenceRuntimeBackup(filename) {
  return hasDesktopPersistence() ? restoreDesktopBackup(filename) : Promise.resolve(null)
}
