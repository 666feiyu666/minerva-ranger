const { URL, pathToFileURL } = require('node:url')
const CHANNELS = require('./channels')
const { PersistenceError, serializePersistenceError } = require('./errors')

function createTrustedSenderCheck(indexPath) {
  const trustedFileUrl = pathToFileURL(indexPath)
  return (event) => {
    const senderUrl = event.senderFrame?.url || event.sender?.getURL() || ''
    try {
      const parsed = new URL(senderUrl)
      return parsed.protocol === 'file:' && parsed.pathname === trustedFileUrl.pathname
    } catch {
      return false
    }
  }
}

function registerPersistenceIpc({ ipcMain, service, indexPath, appVersion }) {
  const isTrustedSender = createTrustedSenderCheck(indexPath)
  const register = (channel, handler) => {
    ipcMain.removeHandler(channel)
    ipcMain.handle(channel, async (event, payload) => {
      if (!isTrustedSender(event)) {
        return {
          ok: false,
          error: serializePersistenceError(
            new PersistenceError('UNTRUSTED_SENDER', '已拒绝非应用页面的持久化请求。', null, {
              recoverable: false,
            }),
          ),
        }
      }
      try {
        return { ok: true, data: await handler(payload) }
      } catch (error) {
        return { ok: false, error: serializePersistenceError(error) }
      }
    })
  }

  register(CHANNELS.INITIALIZE, (payload) =>
    service.initialize(payload?.legacyEnvelope).then((result) => ({ ...result, appVersion })),
  )
  register(CHANNELS.LOAD_SNAPSHOT, () => service.loadSnapshot())
  register(CHANNELS.COMMIT_SNAPSHOT, (payload) => service.commitSnapshot(payload))
  register(CHANNELS.CREATE_BACKUP, (payload) => service.createBackup(payload?.reason))
  register(CHANNELS.LIST_BACKUPS, () => service.listBackups())
  register(CHANNELS.RESTORE_BACKUP, (payload) => service.restoreBackup(payload?.filename))
  register(CHANNELS.GET_DIAGNOSTICS, () => service.getDiagnostics())

  return () => {
    for (const channel of Object.values(CHANNELS)) ipcMain.removeHandler(channel)
  }
}

module.exports = { createTrustedSenderCheck, registerPersistenceIpc }
