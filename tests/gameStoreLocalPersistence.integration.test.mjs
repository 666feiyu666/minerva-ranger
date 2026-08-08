import test from 'node:test'
import assert from 'node:assert/strict'
import { rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { buildSync } from 'esbuild'

class MemoryStorage {
  constructor() {
    this.values = new Map()
    this.failWrites = false
  }

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
    this.failWrites = false
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null
  }

  key(index) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key) {
    if (this.failWrites) throw new Error('Simulated localStorage write failure')
    this.values.delete(key)
  }

  setItem(key, value) {
    if (this.failWrites) throw new Error('Simulated localStorage write failure')
    this.values.set(key, String(value))
  }
}

async function withMutedConsoleError(operation) {
  const originalConsoleError = console.error
  console.error = () => {}
  try {
    return await operation()
  } finally {
    await new Promise(resolve => setTimeout(resolve, 0))
    console.error = originalConsoleError
  }
}

test('localStorage 存档在重启、损坏和写入失败时保持可恢复', async t => {
  const repoRoot = path.resolve(import.meta.dirname, '..')
  const bundledStorePath = path.join(tmpdir(), `mr-local-storage-${Date.now()}.mjs`)
  const storage = new MemoryStorage()
  globalThis.localStorage = storage

  buildSync({
    stdin: {
      contents: `
        import { createPinia, setActivePinia } from 'pinia'
        import { useGameStore } from '@/stores/gameStore'

        export function createTestGameStore() {
          setActivePinia(createPinia())
          return useGameStore()
        }
      `,
      resolveDir: repoRoot,
      sourcefile: 'local-storage-test-entry.mjs'
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: bundledStorePath,
    loader: { '.png': 'dataurl' },
    define: {
      'import.meta.env.VITE_ENABLE_CLOUD_SYNC': '"false"',
      'import.meta.env.VITE_SYNC_API_URL': '""',
      'import.meta.env.DEV': 'false'
    },
    alias: { '@': path.join(repoRoot, 'src') }
  })

  try {
    const { createTestGameStore } = await import(pathToFileURL(bundledStorePath).href)

    await t.test('首次启动自动创建开发设计师身份档案和三个默认技能', () => {
      storage.clear()
      const store = createTestGameStore()
      store.initSaveSystem()

      assert.equal(store.saveSlots.length, 1)
      assert.equal(store.saveSlots[0].name, '开发设计师')
      assert.equal(store.enterSlot(store.saveSlots[0].id), true)
      assert.deepEqual(store.themes.map(theme => theme.name), ['写代码', '做设计', '推广与宣传'])
    })

    await t.test('用户手动创建的新身份档案保持空白', () => {
      storage.clear()
      const store = createTestGameStore()
      store.initSaveSystem()
      const slotId = store.createSaveSlot('D&D')

      assert.ok(slotId)
      assert.equal(store.enterSlot(slotId), true)
      assert.deepEqual(store.themes, [])
      assert.deepEqual(store.projects, [])
    })

    await t.test('没有运行任务的存档重启后仍可开始种植', () => {
      storage.clear()
      const first = createTestGameStore()
      first.initSaveSystem()
      const slotId = first.createSaveSlot('重启测试')
      assert.ok(slotId)
      assert.equal(first.enterSlot(slotId), true)
      first.createProject('项目 A')
      assert.equal(first.saveActiveSlot(false), true)

      const restored = createTestGameStore()
      restored.initSaveSystem()
      assert.equal(restored.enterSlot(slotId), true)
      assert.equal(restored.runningProjectId, null)
      assert.equal(restored.activeTreeId, null)

      const startResult = restored.startAction('t1', {
        mode: 'countup',
        targetDuration: ''
      })
      assert.equal(startResult.ok, true)
      restored.stopTimer()
    })

    await t.test('暂停中的任务在重启后仍保持明确的任务归属', () => {
      storage.clear()
      const first = createTestGameStore()
      first.initSaveSystem()
      const slotId = first.createSaveSlot('暂停任务测试')
      first.enterSlot(slotId)
      first.createProject('项目 B')
      const startResult = first.startAction('t1', {
        mode: 'countup',
        targetDuration: ''
      })
      assert.equal(startResult.ok, true)
      first.stopTimer()
      first.timer = 300
      first.saveActiveSlot(false)

      const restored = createTestGameStore()
      restored.initSaveSystem()
      assert.equal(restored.enterSlot(slotId), true)
      assert.equal(restored.runningProjectId, restored.activeProjectId)
      assert.equal(restored.activeTreeId, 't1')
      assert.equal(restored.timer, 300)
      assert.equal(restored.isRunning, false)
    })

    await t.test('主存档 JSON 损坏时回退到上一份备份', () => {
      storage.clear()
      const first = createTestGameStore()
      first.initSaveSystem()
      const slotId = first.createSaveSlot('备份测试')
      first.enterSlot(slotId)
      first.createProject('备份中的项目')
      first.saveActiveSlot(false)
      first.renameProject(first.projects[0].id, '主存档中的项目')
      first.saveActiveSlot(false)

      const slotKey = `minerva_save_slot_${slotId}`
      storage.setItem(slotKey, '{ invalid json')

      const restored = createTestGameStore()
      restored.initSaveSystem()
      assert.equal(restored.enterSlot(slotId), true)
      assert.equal(restored.projects[0].name, '备份中的项目')
      assert.doesNotThrow(() => JSON.parse(storage.getItem(slotKey)))
    })

    await t.test('存档索引损坏时从实际存档槽重建', () => {
      storage.clear()
      const first = createTestGameStore()
      first.initSaveSystem()
      const slotId = first.createSaveSlot('索引恢复测试')
      assert.ok(slotId)

      storage.setItem('minerva_save_index_v1', '{ invalid index')
      storage.setItem('minerva_save_index_v1_backup', '{ invalid backup')

      const restored = createTestGameStore()
      restored.initSaveSystem()
      assert.equal(restored.saveSlots.length, 2)
      assert.ok(restored.saveSlots.some(slot => slot.id === slotId))
      assert.doesNotThrow(() => JSON.parse(storage.getItem('minerva_save_index_v1')))
    })

    await t.test('写入失败时保留原存档并暴露错误状态', async () => {
      await withMutedConsoleError(async () => {
        storage.clear()
        const store = createTestGameStore()
        store.initSaveSystem()
        const slotId = store.createSaveSlot('写入失败测试')
        store.enterSlot(slotId)
        store.createProject('写入前')
        store.saveActiveSlot(false)

        const slotKey = `minerva_save_slot_${slotId}`
        const persistedBeforeFailure = storage.getItem(slotKey)
        storage.failWrites = true
        store.renameProject(store.projects[0].id, '未成功写入')

        assert.equal(store.saveActiveSlot(false), false)
        assert.equal(storage.getItem(slotKey), persistedBeforeFailure)
        assert.equal(store.persistenceError.action, '保存本地存档')
      })
    })

    await t.test('导入、重命名和删除在重启后保持一致', () => {
      storage.clear()
      const store = createTestGameStore()
      store.initSaveSystem()
      const importedSlotId = store.importSaveAsNewSlot(
        JSON.stringify({
          version: 2,
          slotName: '导入源',
          coins: 42,
          globalXP: 100,
          themes: [],
          projects: [],
          notebook: [],
          unlockedTreeIds: ['t1']
        })
      )

      assert.ok(importedSlotId)
      assert.equal(store.renameSaveSlot(importedSlotId, '已重命名'), true)

      const restored = createTestGameStore()
      restored.initSaveSystem()
      assert.equal(restored.saveSlots.find(slot => slot.id === importedSlotId)?.name, '已重命名')
      assert.equal(restored.enterSlot(importedSlotId), true)
      assert.equal(restored.coins, 42)
      assert.equal(restored.deleteSaveSlot(importedSlotId), true)

      const afterDelete = createTestGameStore()
      afterDelete.initSaveSystem()
      assert.equal(afterDelete.saveSlots.length, 1)
      assert.equal(afterDelete.saveSlots[0].name, '开发设计师')
      assert.equal(storage.getItem(`minerva_save_slot_${importedSlotId}`), null)
      assert.equal(storage.getItem(`minerva_save_slot_${importedSlotId}_backup`), null)
    })

    await t.test('拒绝结构无效的导入存档', async () => {
      await withMutedConsoleError(async () => {
        storage.clear()
        const store = createTestGameStore()
        store.initSaveSystem()

        assert.equal(store.importSaveAsNewSlot('{"projects":{}}'), false)
        assert.equal(store.saveSlots.length, 1)
      })
    })
  } finally {
    rmSync(bundledStorePath, { force: true })
    delete globalThis.localStorage
  }
})
