const { contextBridge, ipcRenderer } = require('electron')
// Sandboxed preload scripts cannot require arbitrary local modules, so this
// whitelist intentionally remains self-contained.
const CHANNELS = Object.freeze({
  INITIALIZE: 'persistence:initialize',
  LOAD_SNAPSHOT: 'persistence:load-snapshot',
  COMMIT_SNAPSHOT: 'persistence:commit-snapshot',
  CREATE_BACKUP: 'persistence:create-backup',
  LIST_BACKUPS: 'persistence:list-backups',
  RESTORE_BACKUP: 'persistence:restore-backup',
  GET_DIAGNOSTICS: 'persistence:get-diagnostics',
})

async function invoke(channel, payload) {
  const response = await ipcRenderer.invoke(channel, payload)
  if (response?.ok) return response.data

  const error = new Error(response?.error?.message || '桌面持久化请求失败。')
  error.code = response?.error?.code || 'PERSISTENCE_FAILED'
  error.details = response?.error?.details || null
  error.recoverable = response?.error?.recoverable ?? true
  throw error
}

contextBridge.exposeInMainWorld(
  'minervaDesktopPersistence',
  Object.freeze({
    initialize: (legacyEnvelope) => invoke(CHANNELS.INITIALIZE, { legacyEnvelope }),
    loadSnapshot: () => invoke(CHANNELS.LOAD_SNAPSHOT),
    commitSnapshot: (payload) => invoke(CHANNELS.COMMIT_SNAPSHOT, payload),
    createBackup: (reason) => invoke(CHANNELS.CREATE_BACKUP, { reason }),
    listBackups: () => invoke(CHANNELS.LIST_BACKUPS),
    restoreBackup: (filename) => invoke(CHANNELS.RESTORE_BACKUP, { filename }),
    getDiagnostics: () => invoke(CHANNELS.GET_DIAGNOSTICS),
  }),
)
