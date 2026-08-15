const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { backup, DatabaseSync } = require('node:sqlite')
const { PersistenceError, toPersistenceError } = require('./errors')
const { normalizePersistenceSnapshot } = require('./validation')

const SCHEMA_VERSION = 1
const DATABASE_FILENAME = 'minerva-ranger.sqlite3'

const INITIAL_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    checksum TEXT NOT NULL,
    applied_at TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS ranger_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    format_version INTEGER NOT NULL,
    revision INTEGER NOT NULL,
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS save_index (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    revision INTEGER NOT NULL,
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS identity_slots (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_played_at TEXT,
    summary TEXT NOT NULL,
    format_version INTEGER NOT NULL,
    revision INTEGER NOT NULL,
    payload TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS migration_log (
    source_key TEXT PRIMARY KEY,
    fingerprint TEXT NOT NULL,
    status TEXT NOT NULL,
    slot_count INTEGER NOT NULL,
    error_code TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT
  ) STRICT;

  CREATE TABLE IF NOT EXISTS backup_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reason TEXT NOT NULL,
    filename TEXT NOT NULL,
    schema_version INTEGER NOT NULL,
    data_revision INTEGER NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at TEXT NOT NULL
  ) STRICT;
`

function nowIso() {
  return new Date().toISOString()
}

function parseJson(value, label) {
  try {
    return JSON.parse(value)
  } catch (error) {
    throw new PersistenceError('DATABASE_CORRUPT', `${label}不是有效 JSON。`, null, {
      cause: error,
      recoverable: false,
    })
  }
}

function safeBackupReason(reason) {
  return (
    String(reason || 'manual')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'manual'
  )
}

class PersistenceDatabase {
  constructor(userDataPath) {
    this.dataDirectory = path.join(userDataPath, 'data')
    this.backupDirectory = path.join(this.dataDirectory, 'backups')
    this.databasePath = path.join(this.dataDirectory, DATABASE_FILENAME)
    this.database = null
  }

  open() {
    if (this.database?.isOpen) return
    try {
      fs.mkdirSync(this.backupDirectory, { recursive: true })
      this.database = new DatabaseSync(this.databasePath, {
        allowExtension: false,
        defensive: true,
        timeout: 5000,
      })
      this.database.exec(`
        PRAGMA busy_timeout = 5000;
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = FULL;
        PRAGMA trusted_schema = OFF;
      `)
      this.applyMigrations()
    } catch (error) {
      this.close()
      throw toPersistenceError(error, 'DATABASE_OPEN_FAILED')
    }
  }

  applyMigrations() {
    const currentVersion = Number(this.database.prepare('PRAGMA user_version').get().user_version)
    if (currentVersion > SCHEMA_VERSION) {
      throw new PersistenceError(
        'SCHEMA_TOO_NEW',
        `存档模式版本 ${currentVersion} 高于应用支持的 ${SCHEMA_VERSION}。`,
        { currentVersion, supportedVersion: SCHEMA_VERSION },
        { recoverable: false },
      )
    }
    if (currentVersion === SCHEMA_VERSION) return

    this.database.exec('BEGIN IMMEDIATE')
    try {
      this.database.exec(INITIAL_SCHEMA_SQL)
      const appliedAt = nowIso()
      const checksum = crypto.createHash('sha256').update(INITIAL_SCHEMA_SQL).digest('hex')
      this.database
        .prepare(
          `INSERT OR IGNORE INTO schema_migrations (version, name, checksum, applied_at)
           VALUES (?, ?, ?, ?)`,
        )
        .run(1, 'initial_persistence_schema', checksum, appliedAt)
      this.setMetadata('data_revision', 0, appliedAt)
      this.setMetadata('default_identity_bootstrapped', false, appliedAt)
      this.database.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`)
      this.database.exec('COMMIT')
    } catch (error) {
      if (this.database.isTransaction) this.database.exec('ROLLBACK')
      throw toPersistenceError(error, 'SCHEMA_MIGRATION_FAILED')
    }
  }

  getMetadata(key, fallback = null) {
    const row = this.database.prepare('SELECT value FROM app_metadata WHERE key = ?').get(key)
    return row ? parseJson(row.value, `元数据 ${key}`) : fallback
  }

  setMetadata(key, value, timestamp = nowIso()) {
    this.database
      .prepare(
        `INSERT INTO app_metadata (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      )
      .run(key, JSON.stringify(value), timestamp)
  }

  getDataRevision() {
    return Math.max(0, Number(this.getMetadata('data_revision', 0)) || 0)
  }

  isEmpty() {
    const row = this.database
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM ranger_profile) AS ranger_count,
           (SELECT COUNT(*) FROM save_index) AS index_count,
           (SELECT COUNT(*) FROM identity_slots) AS slot_count`,
      )
      .get()
    return row.ranger_count === 0 && row.index_count === 0 && row.slot_count === 0
  }

  loadSnapshot() {
    this.open()
    const integrity = this.database.prepare('PRAGMA quick_check').get().quick_check
    if (integrity !== 'ok') {
      throw new PersistenceError(
        'DATABASE_CORRUPT',
        'SQLite 完整性检查失败。',
        { integrity },
        { recoverable: false },
      )
    }

    const indexRow = this.database.prepare('SELECT payload FROM save_index WHERE id = 1').get()
    const rangerRow = this.database.prepare('SELECT payload FROM ranger_profile WHERE id = 1').get()
    const slotRows = this.database
      .prepare('SELECT id, payload FROM identity_slots ORDER BY updated_at DESC, id ASC')
      .all()

    return {
      schemaVersion: SCHEMA_VERSION,
      revision: this.getDataRevision(),
      databasePath: this.databasePath,
      defaultIdentityBootstrapped: Boolean(
        this.getMetadata('default_identity_bootstrapped', false),
      ),
      saveIndex: indexRow ? parseJson(indexRow.payload, '存档索引') : null,
      rangerProfile: rangerRow ? parseJson(rangerRow.payload, '巡林官档案') : null,
      slots: slotRows.map((row) => ({
        id: row.id,
        payload: parseJson(row.payload, `身份 ${row.id}`),
      })),
    }
  }

  writeSnapshot(snapshot, expectedRevision = null) {
    this.open()
    const normalized = normalizePersistenceSnapshot(snapshot)
    const timestamp = nowIso()

    this.database.exec('BEGIN IMMEDIATE')
    try {
      const currentRevision = this.getDataRevision()
      if (
        expectedRevision !== null &&
        Number.isInteger(Number(expectedRevision)) &&
        Number(expectedRevision) !== currentRevision
      ) {
        throw new PersistenceError('STALE_WRITE', '存档已被更新，请重新载入后再保存。', {
          expectedRevision: Number(expectedRevision),
          currentRevision,
        })
      }
      const nextRevision = currentRevision + 1
      this.writeNormalizedSnapshot(normalized, nextRevision, timestamp)
      this.database.exec('COMMIT')
      return { revision: nextRevision, updatedAt: timestamp }
    } catch (error) {
      if (this.database.isTransaction) this.database.exec('ROLLBACK')
      throw toPersistenceError(error)
    }
  }

  writeNormalizedSnapshot(snapshot, revision, timestamp) {
    this.database
      .prepare(
        `INSERT INTO save_index (id, revision, payload, updated_at) VALUES (1, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           revision = excluded.revision,
           payload = excluded.payload,
           updated_at = excluded.updated_at`,
      )
      .run(revision, JSON.stringify(snapshot.saveIndex), timestamp)

    if (snapshot.rangerProfile) {
      this.database
        .prepare(
          `INSERT INTO ranger_profile (id, format_version, revision, payload, updated_at)
           VALUES (1, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             format_version = excluded.format_version,
             revision = excluded.revision,
             payload = excluded.payload,
             updated_at = excluded.updated_at`,
        )
        .run(
          Math.max(1, Number(snapshot.rangerProfile.version) || 1),
          revision,
          JSON.stringify(snapshot.rangerProfile),
          timestamp,
        )
    } else {
      this.database.exec('DELETE FROM ranger_profile')
    }

    this.database.exec('DELETE FROM identity_slots')
    const insertSlot = this.database.prepare(
      `INSERT INTO identity_slots (
         id, name, created_at, updated_at, last_played_at, summary,
         format_version, revision, payload
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    const metadataById = new Map(snapshot.saveIndex.slots.map((slot) => [slot.id, slot]))
    for (const slot of snapshot.slots) {
      const metadata = metadataById.get(slot.id)
      insertSlot.run(
        slot.id,
        metadata.name,
        metadata.createdAt || timestamp,
        metadata.updatedAt || timestamp,
        metadata.lastPlayedAt || null,
        JSON.stringify(metadata.summary || {}),
        Math.max(1, Number(slot.payload.version) || 1),
        revision,
        JSON.stringify(slot.payload),
      )
    }

    this.setMetadata('default_identity_bootstrapped', snapshot.defaultIdentityBootstrapped, timestamp)
    this.setMetadata('data_revision', revision, timestamp)
  }

  migrateLegacy(envelope) {
    this.open()
    if (!this.isEmpty()) return { migrated: false, reason: 'database-not-empty' }

    const sourceKey = 'renderer-localstorage-v1'
    const completed = this.database
      .prepare('SELECT status FROM migration_log WHERE source_key = ?')
      .get(sourceKey)
    if (completed?.status === 'completed' || completed?.status === 'no-data') {
      return { migrated: false, reason: 'already-processed' }
    }

    const hasLegacyData = Boolean(envelope?.hasLegacyData)
    const fingerprint = crypto
      .createHash('sha256')
      .update(JSON.stringify(envelope?.snapshot || {}))
      .digest('hex')
    const timestamp = nowIso()

    if (!hasLegacyData) {
      this.database
        .prepare(
          `INSERT OR REPLACE INTO migration_log (
             source_key, fingerprint, status, slot_count, created_at, completed_at
           ) VALUES (?, ?, 'no-data', 0, ?, ?)`,
        )
        .run(sourceKey, fingerprint, timestamp, timestamp)
      return { migrated: false, reason: 'no-data' }
    }

    let normalized
    try {
      normalized = normalizePersistenceSnapshot(envelope.snapshot)
    } catch (error) {
      this.recordMigrationFailure(sourceKey, fingerprint, error)
      throw error
    }

    this.database.exec('BEGIN IMMEDIATE')
    try {
      this.writeNormalizedSnapshot(normalized, 1, timestamp)
      this.database
        .prepare(
          `INSERT OR REPLACE INTO migration_log (
             source_key, fingerprint, status, slot_count, created_at, completed_at
           ) VALUES (?, ?, 'completed', ?, ?, ?)`,
        )
        .run(sourceKey, fingerprint, normalized.slots.length, timestamp, timestamp)
      this.database.exec('COMMIT')
      return { migrated: true, slotCount: normalized.slots.length, fingerprint }
    } catch (error) {
      if (this.database.isTransaction) this.database.exec('ROLLBACK')
      this.recordMigrationFailure(sourceKey, fingerprint, error)
      throw toPersistenceError(error, 'LEGACY_MIGRATION_FAILED')
    }
  }

  recordMigrationFailure(sourceKey, fingerprint, error) {
    const timestamp = nowIso()
    const normalized = toPersistenceError(error, 'LEGACY_MIGRATION_FAILED')
    this.database
      .prepare(
        `INSERT OR REPLACE INTO migration_log (
           source_key, fingerprint, status, slot_count, error_code, error_message, created_at
         ) VALUES (?, ?, 'failed', 0, ?, ?, ?)`,
      )
      .run(sourceKey, fingerprint, normalized.code, normalized.message, timestamp)
  }

  async createBackup(reason = 'manual') {
    this.open()
    const timestamp = nowIso()
    const revision = this.getDataRevision()
    const filename = `${timestamp.replace(/[:.]/g, '-')}_${safeBackupReason(reason)}.sqlite3`
    const backupPath = path.join(this.backupDirectory, filename)

    try {
      await backup(this.database, backupPath)
      const candidate = new DatabaseSync(backupPath, { readOnly: true })
      const integrity = candidate.prepare('PRAGMA integrity_check').get().integrity_check
      candidate.close()
      if (integrity !== 'ok') throw new Error(`backup integrity_check: ${integrity}`)
      this.database
        .prepare(
          `INSERT INTO backup_log (
             reason, filename, schema_version, data_revision, status, created_at
           ) VALUES (?, ?, ?, ?, 'completed', ?)`,
        )
        .run(reason, filename, SCHEMA_VERSION, revision, timestamp)
      return { filename, revision, createdAt: timestamp }
    } catch (error) {
      this.database
        .prepare(
          `INSERT INTO backup_log (
             reason, filename, schema_version, data_revision, status, error_message, created_at
           ) VALUES (?, ?, ?, ?, 'failed', ?, ?)`,
        )
        .run(reason, filename, SCHEMA_VERSION, revision, error.message, timestamp)
      throw toPersistenceError(error, 'BACKUP_FAILED')
    }
  }

  listBackups() {
    try {
      this.open()
      return this.database
        .prepare(
          `SELECT filename, reason, schema_version AS schemaVersion,
                  data_revision AS revision, status, error_message AS errorMessage,
                  created_at AS createdAt
           FROM backup_log ORDER BY id DESC`,
        )
        .all()
    } catch {
      return fs
        .readdirSync(this.backupDirectory, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.sqlite3'))
        .map((entry) => ({
          filename: entry.name,
          reason: 'recovery-scan',
          schemaVersion: null,
          revision: null,
          status: 'discovered',
          errorMessage: null,
          createdAt: fs.statSync(path.join(this.backupDirectory, entry.name)).mtime.toISOString(),
        }))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    }
  }

  async restoreBackup(filename) {
    if (path.basename(filename) !== filename) {
      throw new PersistenceError('INVALID_BACKUP', '备份文件名无效。')
    }
    const sourcePath = path.join(this.backupDirectory, filename)
    if (!fs.existsSync(sourcePath)) {
      throw new PersistenceError('BACKUP_NOT_FOUND', '找不到指定备份。')
    }

    const candidate = new DatabaseSync(sourcePath, { readOnly: true })
    const integrity = candidate.prepare('PRAGMA integrity_check').get().integrity_check
    const candidateVersion = Number(candidate.prepare('PRAGMA user_version').get().user_version)
    candidate.close()
    if (integrity !== 'ok' || candidateVersion > SCHEMA_VERSION) {
      throw new PersistenceError('INVALID_BACKUP', '备份损坏或模式版本不受支持。', {
        integrity,
        candidateVersion,
      })
    }

    const restoreTempPath = `${this.databasePath}.restore.tmp`
    fs.copyFileSync(sourcePath, restoreTempPath)
    this.close()

    const preservedPath = `${this.databasePath}.pre-restore-${Date.now()}`
    try {
      if (fs.existsSync(this.databasePath)) fs.renameSync(this.databasePath, preservedPath)
      for (const suffix of ['-wal', '-shm']) {
        const sidecar = `${this.databasePath}${suffix}`
        if (fs.existsSync(sidecar)) fs.rmSync(sidecar, { force: true })
      }
      fs.renameSync(restoreTempPath, this.databasePath)
      this.open()
      const restored = this.loadSnapshot()
      return { restored, preservedPath }
    } catch (error) {
      this.close()
      if (fs.existsSync(this.databasePath)) {
        fs.renameSync(this.databasePath, `${this.databasePath}.failed-restore-${Date.now()}`)
      }
      if (fs.existsSync(preservedPath)) {
        fs.renameSync(preservedPath, this.databasePath)
      }
      this.open()
      throw toPersistenceError(error, 'RESTORE_FAILED')
    }
  }

  getDiagnostics() {
    this.open()
    const quickCheck = this.database.prepare('PRAGMA quick_check').get().quick_check
    const journalMode = this.database.prepare('PRAGMA journal_mode').get().journal_mode
    const foreignKeys = this.database.prepare('PRAGMA foreign_keys').get().foreign_keys
    return {
      status: quickCheck === 'ok' ? 'ready' : 'degraded',
      schemaVersion: SCHEMA_VERSION,
      revision: this.getDataRevision(),
      quickCheck,
      journalMode,
      foreignKeys: Boolean(foreignKeys),
      databasePath: this.databasePath,
      backupDirectory: this.backupDirectory,
      runtime: {
        electron: process.versions.electron || null,
        node: process.versions.node,
        sqlite: process.versions.sqlite,
      },
    }
  }

  close() {
    if (!this.database?.isOpen) return
    this.database.close()
    this.database = null
  }
}

module.exports = {
  DATABASE_FILENAME,
  PersistenceDatabase,
  SCHEMA_VERSION,
}
