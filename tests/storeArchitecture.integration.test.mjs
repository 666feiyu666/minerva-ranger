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
  }

  get length() {
    return this.values.size
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null
  }

  key(index) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key) {
    this.values.delete(key)
  }

  setItem(key, value) {
    this.values.set(key, String(value))
  }
}

test('领域 Store 重构保持跨模块业务与 version 3 存档契约', async () => {
  const repoRoot = path.resolve(import.meta.dirname, '..')
  const bundledStorePath = path.join(tmpdir(), `mr-architecture-${Date.now()}.mjs`)
  globalThis.localStorage = new MemoryStorage()

  buildSync({
    stdin: {
      contents: `
        import { createPinia, setActivePinia } from 'pinia'
        import { useNotebookStore } from '@/stores/notebookStore'
        import { usePlantingStore } from '@/stores/plantingStore'
        import { usePlayerStore } from '@/stores/playerStore'
        import { useActionWorkflow } from '@/application/workflows/actionWorkflow'
        import { useActionStore } from '@/stores/actionStore'
        import { useSaveStore } from '@/stores/saveStore'

        export function createTestArchitecture() {
          setActivePinia(createPinia())
          const save = useSaveStore()
          return {
            notebook: useNotebookStore(),
            planting: usePlantingStore(),
            player: usePlayerStore(),
            action: useActionStore(),
            actionWorkflow: useActionWorkflow(),
            save
          }
        }
      `,
      resolveDir: repoRoot,
      sourcefile: 'architecture-test-entry.mjs'
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
    const { createTestArchitecture } = await import(pathToFileURL(bundledStorePath).href)
    const { notebook, planting, player, action, actionWorkflow, save } =
      createTestArchitecture()

    save.initSaveSystem()
    assert.equal(save.enterSlot(save.saveSlots[0].id), true)

    action.createSkill('架构测试技能')
    const skillId = action.skills.at(-1).id
    actionWorkflow.createAction('行动 A', skillId)
    const actionAId = action.activeActionId
    await new Promise(resolve => setTimeout(resolve, 2))
    actionWorkflow.createAction('行动 B', skillId)
    const actionBId = action.activeActionId

    notebook.uploadNote('测试日志', '有效内容', [actionAId])
    assert.equal(player.coins, 10)
    const plantingNoteId = notebook.notebook[0].id
    assert.equal(notebook.deleteNote(plantingNoteId), true)
    assert.equal(player.coins, 0)

    player.cheatAddCoins()
    player.cheatAddCoins()
    const willowItem = player.shopItems.find(item => item.productId === 't2')
    assert.equal(player.purchaseShopItem(willowItem), true)
    assert.ok(player.unlockedTreeIds.includes('t2'))

    actionWorkflow.selectAction(actionAId)
    assert.equal(planting.startAction('t1', { mode: 'countup', targetDuration: '' }).ok, true)
    assert.equal(actionWorkflow.deleteAction(actionAId), true)
    assert.equal(planting.runningActionId, null)
    assert.equal(planting.activeTreeId, null)

    await new Promise(resolve => setTimeout(resolve, 2))
    actionWorkflow.createAction('行动 C', skillId)
    const actionCId = action.activeActionId
    const actionC = action.actions.find(item => item.id === actionCId)
    const actionB = action.actions.find(item => item.id === actionBId)
    actionC.totalTrees = 3
    actionC.forest = { t1: 3 }
    actionB.totalTrees = 2
    actionB.forest = { t1: 2 }
    notebook.createEssayNote('关联笔记', '行动合并验证', [actionCId])
    assert.equal(actionWorkflow.mergeActions(actionCId, actionBId), true)
    assert.equal(action.actions.find(item => item.id === actionBId).totalTrees, 5)
    assert.deepEqual(notebook.notebook[0].actionIds, [actionBId])

    const snapshot = save.getSaveData()
    assert.equal(snapshot.version, 3)
    assert.equal(snapshot.slotId, save.activeSlotId)
    assert.ok(Array.isArray(snapshot.actions))
    assert.ok(Array.isArray(snapshot.notebook))
    assert.equal(snapshot.timerMode, 'countup')
  } finally {
    rmSync(bundledStorePath, { force: true })
    delete globalThis.localStorage
  }
})
