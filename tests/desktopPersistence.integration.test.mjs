import assert from 'node:assert/strict'
import { rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import { build } from 'esbuild'

class MemoryStorage {
  constructor(entries = []) {
    this.values = new Map(entries)
  }

  get length() {
    return this.values.size
  }

  key(index) {
    return [...this.values.keys()][index] ?? null
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null
  }

  setItem(key, value) {
    this.values.set(String(key), String(value))
  }

  removeItem(key) {
    this.values.delete(String(key))
  }

  clear() {
    this.values.clear()
  }
}

test('桌面适配器迁移旧 localStorage 后改由 SQLite 快照提交且保留旧数据', async () => {
  const repoRoot = path.resolve(import.meta.dirname, '..')
  const bundlePath = path.join(tmpdir(), `minerva-desktop-persistence-${process.pid}.mjs`)
  await build({
    stdin: {
      contents: `
        export {
          flushDesktopPersistence,
          getDesktopPersistenceStatus,
          initializeDesktopPersistence,
        } from '@/application/persistence/desktopPersistence'
        export { readJson, writeJson } from '@/local-backend/storage/localStorageClient'
      `,
      resolveDir: repoRoot,
      sourcefile: 'desktop-persistence-test-entry.mjs',
    },
    bundle: true,
    platform: 'browser',
    format: 'esm',
    outfile: bundlePath,
    alias: { '@': path.join(repoRoot, 'src') },
  })

  const timestamp = '2026-08-15T00:00:00.000Z'
  const legacySlot = {
    slotId: 'slot_legacy',
    slotName: '旧身份',
    timestamp: Date.parse(timestamp),
    skills: [],
    actions: [],
    notebook: [],
  }
  const legacyRanger = { version: 2, profileId: 'ranger_legacy', globalXP: 12 }
  const legacyIndex = {
    lastSelectedSlotId: 'slot_legacy',
    slots: [
      {
        id: 'slot_legacy',
        name: '旧身份',
        createdAt: timestamp,
        updatedAt: timestamp,
        lastPlayedAt: timestamp,
        summary: {},
      },
    ],
  }
  const nativeStorage = new MemoryStorage([
    ['minerva_default_identity_bootstrapped', '1'],
    ['minerva_save_index', JSON.stringify(legacyIndex)],
    ['minerva_ranger_profile', JSON.stringify(legacyRanger)],
    ['minerva_slot_slot_legacy', '{ damaged'],
    ['minerva_slot_slot_legacy_backup', JSON.stringify(legacySlot)],
  ])

  let initializeEnvelope = null
  const commits = []
  let currentRevision = 1
  const bridge = {
    async initialize(envelope) {
      initializeEnvelope = envelope
      return {
        migration: { migrated: true, slotCount: 1 },
        snapshot: { ...envelope.snapshot, revision: currentRevision, schemaVersion: 1 },
      }
    },
    async commitSnapshot(payload) {
      commits.push(payload)
      currentRevision += 1
      return { revision: currentRevision }
    },
    async loadSnapshot() {
      throw new Error('not used')
    },
    async createBackup() {
      return { filename: 'backup.sqlite3' }
    },
    async listBackups() {
      return []
    },
    async restoreBackup() {
      throw new Error('not used')
    },
    async getDiagnostics() {
      return { status: 'ready' }
    },
  }

  globalThis.window = { localStorage: nativeStorage, minervaDesktopPersistence: bridge }
  globalThis.localStorage = nativeStorage

  try {
    const persistence = await import(`${pathToFileURL(bundlePath).href}?test=${Date.now()}`)
    await persistence.initializeDesktopPersistence()

    assert.equal(initializeEnvelope.hasLegacyData, true)
    assert.equal(initializeEnvelope.snapshot.slots[0].payload.slotName, '旧身份')
    assert.equal(persistence.readJson('minerva_slot_slot_legacy').slotName, '旧身份')

    persistence.writeJson('minerva_ranger_profile', {
      ...legacyRanger,
      globalXP: 99,
    })
    await persistence.flushDesktopPersistence()

    assert.ok(commits.length >= 1)
    assert.equal(commits.at(-1).expectedRevision, 1)
    assert.equal(commits.at(-1).snapshot.rangerProfile.globalXP, 99)
    assert.equal(persistence.getDesktopPersistenceStatus().state, 'ready')
    assert.equal(JSON.parse(nativeStorage.getItem('minerva_ranger_profile')).globalXP, 12)
    assert.equal(nativeStorage.getItem('minerva_slot_slot_legacy'), '{ damaged')
  } finally {
    rmSync(bundlePath, { force: true })
    delete globalThis.window
    delete globalThis.localStorage
  }
})
