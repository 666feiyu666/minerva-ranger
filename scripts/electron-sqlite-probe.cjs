const assert = require('node:assert/strict')
const { mkdtempSync, readFileSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')
const { backup, DatabaseSync } = require('node:sqlite')

async function runProbe() {
  const probeDirectory = mkdtempSync(path.join(tmpdir(), 'minerva-electron-sqlite-'))
  const databasePath = path.join(probeDirectory, 'probe.sqlite3')
  const backupPath = path.join(probeDirectory, 'probe.backup.sqlite3')

  try {
    const database = new DatabaseSync(databasePath, {
      allowExtension: false,
      timeout: 5000,
    })
    database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE probe (
        id INTEGER PRIMARY KEY,
        value TEXT NOT NULL
      ) STRICT;
      BEGIN IMMEDIATE;
      INSERT INTO probe (value) VALUES ('ok');
      COMMIT;
    `)

    assert.equal(database.prepare('SELECT value FROM probe WHERE id = 1').get().value, 'ok')
    await backup(database, backupPath)
    database.close()

    const reopened = new DatabaseSync(databasePath, { readOnly: true })
    assert.equal(reopened.prepare('PRAGMA integrity_check').get().integrity_check, 'ok')
    assert.equal(reopened.prepare('SELECT value FROM probe WHERE id = 1').get().value, 'ok')
    reopened.close()

    assert.ok(readFileSync(backupPath).byteLength > 0)
    console.log(
      JSON.stringify({
        ok: true,
        electron: process.versions.electron,
        node: process.versions.node,
        sqlite: process.versions.sqlite,
      }),
    )
  } finally {
    rmSync(probeDirectory, { recursive: true, force: true })
  }
}

runProbe().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
