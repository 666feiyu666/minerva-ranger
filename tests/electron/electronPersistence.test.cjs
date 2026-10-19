const assert = require('node:assert/strict')
const { mkdirSync, mkdtempSync, rmSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')
const { DatabaseSync } = require('node:sqlite')
const { PersistenceDatabase } = require('../electron/persistence/database')
const { toPersistenceError } = require('../electron/persistence/errors')
const { createTrustedSenderCheck } = require('../electron/persistence/ipc')

function createSnapshot(name = '开发设计师') {
  const timestamp = '2026-08-15T00:00:00.000Z'
  return {
    defaultIdentityBootstrapped: true,
    saveIndex: {
      lastSelectedSlotId: 'slot_1',
      slots: [
        {
          id: 'slot_1',
          name,
          createdAt: timestamp,
          updatedAt: timestamp,
          lastPlayedAt: timestamp,
          summary: { skillCount: 3 },
        },
      ],
    },
    rangerProfile: {
      version: 2,
      profileId: 'ranger_1',
      globalXP: 10,
      coins: 5,
    },
    slots: [
      {
        id: 'slot_1',
        payload: {
          version: 2,
          slotId: 'slot_1',
          slotName: name,
          skills: [],
          actions: [],
          notebook: [],
        },
      },
    ],
  }
}

function withDatabase(run) {
  const directory = mkdtempSync(path.join(tmpdir(), 'minerva-persistence-test-'))
  const database = new PersistenceDatabase(directory)
  return Promise.resolve()
    .then(() => run(database, directory))
    .finally(() => {
      database.close()
      rmSync(directory, { recursive: true, force: true })
    })
}

test('SQLite 快照以修订号原子提交并可在重启后恢复', () =>
  withDatabase((database) => {
    database.open()
    assert.equal(database.loadSnapshot().revision, 0)

    const committed = database.writeSnapshot(createSnapshot(), 0)
    assert.equal(committed.revision, 1)
    database.close()

    const restored = database.loadSnapshot()
    assert.equal(restored.revision, 1)
    assert.equal(restored.saveIndex.slots[0].name, '开发设计师')
    assert.equal(restored.rangerProfile.globalXP, 10)
    assert.equal(restored.slots[0].payload.slotId, 'slot_1')
    assert.equal(restored.defaultIdentityBootstrapped, true)
  }))

test('陈旧修订和非法快照不会产生半写入', () =>
  withDatabase((database) => {
    database.open()
    database.writeSnapshot(createSnapshot(), 0)

    assert.throws(
      () => database.writeSnapshot(createSnapshot('陈旧写入'), 0),
      (error) => error.code === 'STALE_WRITE',
    )
    assert.throws(
      () =>
        database.writeSnapshot(
          { ...createSnapshot('缺失数据'), slots: [] },
          database.getDataRevision(),
        ),
      (error) => error.code === 'INVALID_PAYLOAD',
    )

    const restored = database.loadSnapshot()
    assert.equal(restored.revision, 1)
    assert.equal(restored.saveIndex.slots[0].name, '开发设计师')
  }))

test('legacy localStorage envelope 只迁移一次', () =>
  withDatabase((database) => {
    database.open()
    const envelope = { hasLegacyData: true, snapshot: createSnapshot('旧身份') }
    const first = database.migrateLegacy(envelope)
    const second = database.migrateLegacy(envelope)

    assert.equal(first.migrated, true)
    assert.equal(first.slotCount, 1)
    assert.equal(second.migrated, false)
    assert.equal(second.reason, 'database-not-empty')
    assert.equal(database.loadSnapshot().saveIndex.slots[0].name, '旧身份')
  }))

test('legacy 迁移校验失败会回滚并允许修复后重试', () =>
  withDatabase((database) => {
    database.open()
    assert.throws(
      () =>
        database.migrateLegacy({
          hasLegacyData: true,
          snapshot: { ...createSnapshot(), slots: [] },
        }),
      (error) => error.code === 'INVALID_PAYLOAD',
    )
    assert.equal(database.isEmpty(), true)

    const retry = database.migrateLegacy({ hasLegacyData: true, snapshot: createSnapshot() })
    assert.equal(retry.migrated, true)
    assert.equal(database.loadSnapshot().revision, 1)
  }))

test('损坏数据库、过新模式和只读错误使用结构化错误码', () => {
  const corruptDirectory = mkdtempSync(path.join(tmpdir(), 'minerva-corrupt-test-'))
  const futureDirectory = mkdtempSync(path.join(tmpdir(), 'minerva-future-test-'))
  try {
    const corruptDataDirectory = path.join(corruptDirectory, 'data')
    mkdirSync(corruptDataDirectory, { recursive: true })
    writeFileSync(path.join(corruptDataDirectory, 'minerva-ranger.sqlite3'), 'not a database')
    assert.throws(
      () => new PersistenceDatabase(corruptDirectory).open(),
      (error) => error.code === 'DATABASE_CORRUPT',
    )

    const futureDataDirectory = path.join(futureDirectory, 'data')
    mkdirSync(futureDataDirectory, { recursive: true })
    const futurePath = path.join(futureDataDirectory, 'minerva-ranger.sqlite3')
    const future = new DatabaseSync(futurePath)
    future.exec('PRAGMA user_version = 999')
    future.close()
    assert.throws(
      () => new PersistenceDatabase(futureDirectory).open(),
      (error) => error.code === 'SCHEMA_TOO_NEW' && error.recoverable === false,
    )

    assert.equal(
      toPersistenceError(new Error('SQLITE_READONLY: database is read-only')).code,
      'STORAGE_UNAVAILABLE',
    )
  } finally {
    rmSync(corruptDirectory, { recursive: true, force: true })
    rmSync(futureDirectory, { recursive: true, force: true })
  }
})

test('IPC 只接受实际打包页面的 file URL', () => {
  const indexPath = path.join('D:\\Project\\mr-script', 'dist', 'index.html')
  const isTrusted = createTrustedSenderCheck(indexPath)
  const trustedUrl = pathToFileURL(indexPath).href

  assert.equal(isTrusted({ senderFrame: { url: trustedUrl } }), true)
  assert.equal(isTrusted({ senderFrame: { url: 'https://example.com/index.html' } }), false)
  assert.equal(isTrusted({ senderFrame: { url: 'file:///D:/other/index.html' } }), false)
})

test('在线备份通过完整性检查并可受保护恢复', () =>
  withDatabase(async (database) => {
    database.open()
    database.writeSnapshot(createSnapshot('备份版本'), 0)
    const backup = await database.createBackup('before-import')

    database.writeSnapshot(createSnapshot('修改版本'), 1)
    assert.equal(database.loadSnapshot().saveIndex.slots[0].name, '修改版本')

    const result = await database.restoreBackup(backup.filename)
    assert.equal(result.restored.saveIndex.slots[0].name, '备份版本')
    assert.ok(result.preservedPath)
  }))
