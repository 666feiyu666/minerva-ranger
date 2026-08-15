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
    await new Promise((resolve) => setTimeout(resolve, 0))
    console.error = originalConsoleError
  }
}

test('localStorage 存档在重启、损坏和写入失败时保持可恢复', async (t) => {
  const repoRoot = path.resolve(import.meta.dirname, '..')
  const bundledStorePath = path.join(tmpdir(), `mr-local-storage-${Date.now()}.mjs`)
  const storage = new MemoryStorage()
  globalThis.localStorage = storage

  buildSync({
    stdin: {
      contents: `
        import { createPinia, setActivePinia } from 'pinia'
        import { usePlantingStore } from '@/stores/plantingStore'
        import { usePlayerStore } from '@/stores/playerStore'
        import { useActionWorkflow } from '@/application/workflows/actionWorkflow'
        import { useActionStore } from '@/stores/actionStore'
        import { useNotebookStore } from '@/stores/notebookStore'
        import { useSaveStore } from '@/stores/saveStore'
        import { normalizeSaveIndex } from '@/local-backend/domain/saveSchema'

        export { normalizeSaveIndex }

        export function createTestArchitecture() {
          setActivePinia(createPinia())
          const save = useSaveStore()
          return {
            planting: usePlantingStore(),
            player: usePlayerStore(),
            action: useActionStore(),
            notebook: useNotebookStore(),
            actionWorkflow: useActionWorkflow(),
            save
          }
        }
      `,
      resolveDir: repoRoot,
      sourcefile: 'local-storage-test-entry.mjs',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: bundledStorePath,
    loader: { '.png': 'dataurl' },
    define: {
      'import.meta.env.DEV': 'false',
    },
    alias: { '@': path.join(repoRoot, 'src') },
  })

  try {
    const { createTestArchitecture, normalizeSaveIndex } = await import(
      pathToFileURL(bundledStorePath).href
    )

    await t.test('旧版系统默认名称会升级为新的身份用语', () => {
      const normalized = normalizeSaveIndex({
        slots: [
          { id: 'unnamed', name: '\u672a\u547d\u540d\u8eab\u4efd\u6863\u6848' },
          { id: 'numbered', name: '\u65b0\u8eab\u4efd\u6863\u6848 #2' },
          { id: 'custom', name: '人类学研究者' },
        ],
      })

      assert.deepEqual(
        normalized.slots.map((slot) => slot.name),
        ['未命名身份', '新身份 #2', '人类学研究者'],
      )
    })

    await t.test('首次启动自动创建开发设计师身份和三个默认技能', () => {
      storage.clear()
      const { action, save } = createTestArchitecture()
      save.initSaveSystem()

      assert.equal(save.saveSlots.length, 1)
      assert.equal(save.saveSlots[0].name, '开发设计师')
      assert.equal(save.enterSlot(save.saveSlots[0].id), true)
      assert.deepEqual(
        action.skills.map((skill) => skill.name),
        ['写代码', '做设计', '推广与宣传'],
      )
    })

    await t.test('用户手动创建的新身份保持空白', () => {
      storage.clear()
      const { action, save } = createTestArchitecture()
      save.initSaveSystem()
      const slotId = save.createSaveSlot('D&D')

      assert.ok(slotId)
      assert.equal(save.enterSlot(slotId), true)
      assert.deepEqual(action.skills, [])
      assert.deepEqual(action.actions, [])
    })

    await t.test('没有运行任务的存档重启后仍可开始种植', () => {
      storage.clear()
      const first = createTestArchitecture()
      first.save.initSaveSystem()
      const slotId = first.save.createSaveSlot('重启测试')
      assert.ok(slotId)
      assert.equal(first.save.enterSlot(slotId), true)
      first.actionWorkflow.createAction('行动 A')
      assert.equal(first.save.saveActiveSlot(false), true)

      const restored = createTestArchitecture()
      restored.save.initSaveSystem()
      assert.equal(restored.save.enterSlot(slotId), true)
      assert.equal(restored.planting.runningActionId, null)
      assert.equal(restored.planting.activeTreeId, null)

      const startResult = restored.planting.startAction('t1', {
        mode: 'countup',
        targetDuration: '',
      })
      assert.equal(startResult.ok, true)
      restored.planting.stopTimer()
    })

    await t.test('暂停中的任务在重启后仍保持明确的任务归属', () => {
      storage.clear()
      const first = createTestArchitecture()
      first.save.initSaveSystem()
      const slotId = first.save.createSaveSlot('暂停任务测试')
      first.save.enterSlot(slotId)
      first.actionWorkflow.createAction('行动 B')
      const startResult = first.planting.startAction('t1', {
        mode: 'countup',
        targetDuration: '',
      })
      assert.equal(startResult.ok, true)
      first.planting.stopTimer()
      first.planting.timer = 300
      first.save.saveActiveSlot(false)

      const restored = createTestArchitecture()
      restored.save.initSaveSystem()
      assert.equal(restored.save.enterSlot(slotId), true)
      assert.equal(restored.planting.runningActionId, restored.action.activeActionId)
      assert.equal(restored.planting.activeTreeId, 't1')
      assert.equal(restored.planting.timer, 300)
      assert.equal(restored.planting.isRunning, false)
    })

    await t.test('Markdown 随笔在保存和重启后保持源文及格式标记', () => {
      storage.clear()
      const first = createTestArchitecture()
      first.save.initSaveSystem()
      const slotId = first.save.createSaveSlot('Markdown 重启测试')
      first.save.enterSlot(slotId)
      const source = '# 标题\n\n- 列表\n\n> 引用\n\n```js\nconst value = 1\n```'
      const note = first.notebook.createEssayNote('重启随笔', source)
      assert.ok(note)
      assert.equal(first.save.saveActiveSlot(false), true)

      const restored = createTestArchitecture()
      restored.save.initSaveSystem()
      assert.equal(restored.save.enterSlot(slotId), true)
      assert.equal(restored.notebook.notebook[0].content, source)
      assert.equal(restored.notebook.notebook[0].contentFormat, 'markdown')
    })

    await t.test('主存档 JSON 损坏时回退到上一份备份', () => {
      storage.clear()
      const first = createTestArchitecture()
      first.save.initSaveSystem()
      const slotId = first.save.createSaveSlot('备份测试')
      first.save.enterSlot(slotId)
      first.actionWorkflow.createAction('备份中的行动')
      first.save.saveActiveSlot(false)
      first.action.renameAction(first.action.actions[0].id, '主存档中的行动')
      first.save.saveActiveSlot(false)

      const slotKey = `minerva_slot_${slotId}`
      storage.setItem(slotKey, '{ invalid json')

      const restored = createTestArchitecture()
      restored.save.initSaveSystem()
      assert.equal(restored.save.enterSlot(slotId), true)
      assert.equal(restored.action.actions[0].name, '备份中的行动')
      assert.doesNotThrow(() => JSON.parse(storage.getItem(slotKey)))
    })

    await t.test('存档索引损坏时从实际存档槽重建', () => {
      storage.clear()
      const first = createTestArchitecture()
      first.save.initSaveSystem()
      const slotId = first.save.createSaveSlot('索引恢复测试')
      assert.ok(slotId)

      storage.setItem('minerva_save_index', '{ invalid index')
      storage.setItem('minerva_save_index_backup', '{ invalid backup')

      const restored = createTestArchitecture()
      restored.save.initSaveSystem()
      assert.equal(restored.save.saveSlots.length, 2)
      assert.ok(restored.save.saveSlots.some((slot) => slot.id === slotId))
      assert.doesNotThrow(() => JSON.parse(storage.getItem('minerva_save_index')))
    })

    await t.test('写入失败时保留原存档并暴露错误状态', async () => {
      await withMutedConsoleError(async () => {
        storage.clear()
        const architecture = createTestArchitecture()
        architecture.save.initSaveSystem()
        const slotId = architecture.save.createSaveSlot('写入失败测试')
        architecture.save.enterSlot(slotId)
        architecture.actionWorkflow.createAction('写入前')
        architecture.save.saveActiveSlot(false)

        const slotKey = `minerva_slot_${slotId}`
        const persistedBeforeFailure = storage.getItem(slotKey)
        storage.failWrites = true
        architecture.action.renameAction(architecture.action.actions[0].id, '未成功写入')

        assert.equal(architecture.save.saveActiveSlot(false), false)
        assert.equal(storage.getItem(slotKey), persistedBeforeFailure)
        assert.equal(architecture.save.persistenceError.action, '保存本地存档')
      })
    })

    await t.test('导入、重命名和删除在重启后保持一致', () => {
      storage.clear()
      const architecture = createTestArchitecture()
      architecture.save.initSaveSystem()
      const importedSlotId = architecture.save.importSaveAsNewSlot(
        JSON.stringify({
          slotName: '导入源',
          coins: 42,
          globalXP: 100,
          skills: [],
          actions: [],
          notebook: [],
          unlockedTreeIds: ['t1'],
        }),
      )

      assert.ok(importedSlotId)
      assert.equal(architecture.save.renameSaveSlot(importedSlotId, '已重命名'), true)

      const restored = createTestArchitecture()
      restored.save.initSaveSystem()
      assert.equal(
        restored.save.saveSlots.find((slot) => slot.id === importedSlotId)?.name,
        '已重命名',
      )
      assert.equal(restored.save.enterSlot(importedSlotId), true)
      assert.equal(restored.player.coins, 42)
      assert.equal(restored.save.deleteSaveSlot(importedSlotId), true)

      const afterDelete = createTestArchitecture()
      afterDelete.save.initSaveSystem()
      assert.equal(afterDelete.save.saveSlots.length, 1)
      assert.equal(afterDelete.save.saveSlots[0].name, '开发设计师')
      assert.equal(afterDelete.player.coins, 42)
      assert.equal(storage.getItem(`minerva_slot_${importedSlotId}`), null)
      assert.equal(storage.getItem(`minerva_slot_${importedSlotId}_backup`), null)
    })

    await t.test('巡林官成长跨身份共享且删除身份不会让全局进度倒退', () => {
      storage.clear()
      const first = createTestArchitecture()
      first.save.initSaveSystem()
      const designerSlotId = first.save.saveSlots[0].id
      first.save.enterSlot(designerSlotId)
      first.player.cheatAddCoins()
      first.actionWorkflow.createAction('设计行动')
      first.save.saveActiveSlot(false)

      const anthropologistSlotId = first.save.createSaveSlot('人类学研究者')
      first.save.enterSlot(anthropologistSlotId)
      assert.equal(first.player.coins, 1000)
      assert.equal(first.player.globalXP, 1000)
      assert.deepEqual(first.action.actions, [])

      assert.equal(first.save.deleteSaveSlot(designerSlotId), true)
      const restored = createTestArchitecture()
      restored.save.initSaveSystem()
      restored.save.enterSlot(anthropologistSlotId)
      assert.equal(restored.player.coins, 1000)
      assert.equal(restored.player.globalXP, 1000)
      assert.equal(restored.action.actions.length, 0)
    })

    await t.test('拒绝结构无效的导入存档', async () => {
      await withMutedConsoleError(async () => {
        storage.clear()
        const { save } = createTestArchitecture()
        save.initSaveSystem()

        assert.equal(save.importSaveAsNewSlot('{"actions":{}}'), false)
        assert.equal(save.importSaveAsNewSlot('{"map":[]}'), false)
        assert.equal(save.saveSlots.length, 1)
      })
    })
  } finally {
    rmSync(bundledStorePath, { force: true })
    delete globalThis.localStorage
  }
})
