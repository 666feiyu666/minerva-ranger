const { PersistenceDatabase } = require('./database')

class PersistenceService {
  constructor(userDataPath) {
    this.database = new PersistenceDatabase(userDataPath)
    this.queue = Promise.resolve()
  }

  enqueue(operation) {
    const result = this.queue.then(operation, operation)
    this.queue = result.catch(() => undefined)
    return result
  }

  initialize(legacyEnvelope) {
    return this.enqueue(() => {
      this.database.open()
      const migration = this.database.migrateLegacy(legacyEnvelope)
      return { migration, snapshot: this.database.loadSnapshot() }
    })
  }

  loadSnapshot() {
    return this.enqueue(() => this.database.loadSnapshot())
  }

  commitSnapshot(payload) {
    return this.enqueue(() =>
      this.database.writeSnapshot(payload?.snapshot, payload?.expectedRevision ?? null),
    )
  }

  createBackup(reason) {
    return this.enqueue(() => this.database.createBackup(reason))
  }

  listBackups() {
    return this.enqueue(() => this.database.listBackups())
  }

  restoreBackup(filename) {
    return this.enqueue(() => this.database.restoreBackup(filename))
  }

  getDiagnostics() {
    return this.enqueue(() => this.database.getDiagnostics())
  }

  async close() {
    await this.queue
    this.database.close()
  }
}

module.exports = { PersistenceService }
