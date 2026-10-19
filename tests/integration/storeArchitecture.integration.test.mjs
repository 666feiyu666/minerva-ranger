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

test('领域 Store 重构保持跨模块业务与当前存档契约', async () => {
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
        import { useSkillWorkflow } from '@/application/workflows/skillWorkflow'
        import { useActionStore } from '@/stores/actionStore'
        import { useAppStore } from '@/stores/appStore'
        import { useSaveStore } from '@/stores/saveStore'

        export function createTestArchitecture() {
          setActivePinia(createPinia())
          const save = useSaveStore()
          return {
            notebook: useNotebookStore(),
            planting: usePlantingStore(),
            player: usePlayerStore(),
            action: useActionStore(),
            app: useAppStore(),
            actionWorkflow: useActionWorkflow(),
            skillWorkflow: useSkillWorkflow(),
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
      'import.meta.env.DEV': 'false'
    },
    alias: { '@': path.join(repoRoot, 'src') }
  })

  try {
    const { createTestArchitecture } = await import(pathToFileURL(bundledStorePath).href)
    const { notebook, planting, player, action, app, actionWorkflow, skillWorkflow, save } =
      createTestArchitecture()

    save.initSaveSystem()
    assert.equal(save.enterSlot(save.saveSlots[0].id), true)

    const viewBeforeGuard = app.activeView
    const unregisterGuard = app.registerViewChangeGuard(async () => false)
    assert.equal(await app.openShop(), false)
    assert.equal(app.activeView, viewBeforeGuard)
    unregisterGuard()

    action.createSkill('架构测试技能')
    const skillId = action.skills.at(-1).id
    actionWorkflow.createAction('行动 A', skillId)
    const actionAId = action.activeActionId
    await new Promise(resolve => setTimeout(resolve, 2))
    actionWorkflow.createAction('行动 B', skillId)
    const actionBId = action.activeActionId

    const actionA = action.actions.find(item => item.id === actionAId)
    const actionB = action.actions.find(item => item.id === actionBId)
    actionA.totalXP = 10
    actionA.totalTrees = 1
    actionA.totalTimeSpent = 60
    actionB.totalXP = 20
    actionB.totalTrees = 2
    actionB.totalTimeSpent = 120
    const skillSummary = action.skillSummaries.find(skill => skill.id === skillId)
    assert.deepEqual(
      {
        actionCount: skillSummary.actionCount,
        totalXP: skillSummary.totalXP,
        totalTrees: skillSummary.totalTrees,
        totalTimeSpent: skillSummary.totalTimeSpent
      },
      {
        actionCount: 2,
        totalXP: 30,
        totalTrees: 3,
        totalTimeSpent: 180
      }
    )

    notebook.uploadNote('测试日志', '有效内容', [actionAId])
    assert.equal(player.coins, 10)
    const plantingNoteId = notebook.notebook[0].id
    assert.equal(notebook.deleteNote(plantingNoteId), true)
    assert.equal(player.coins, 10)

    const firstSession = notebook.createNote({
      title: '[植树日志] 测试幂等',
      content: '只奖励一次',
      actionIds: [actionAId],
      type: 'planting',
      sessionId: 'session_test_once',
      allowEmptyContent: true
    })
    const repeatedSession = notebook.createNote({
      title: '[植树日志] 测试幂等',
      content: '重复提交',
      actionIds: [actionAId],
      type: 'planting',
      sessionId: 'session_test_once',
      allowEmptyContent: true
    })
    assert.equal(firstSession.id, repeatedSession.id)
    assert.equal(notebook.notebook.filter(note => note.sessionId === 'session_test_once').length, 1)
    assert.equal(player.coins, 20)

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
    const deletedActionNote = notebook.notebook.find(note => note.sessionId === 'session_test_once')
    assert.deepEqual(deletedActionNote.actionIds, [])
    assert.equal(deletedActionNote.skillId, skillId)
    assert.equal(deletedActionNote.actionNameSnapshot, '行动 A')

    await new Promise(resolve => setTimeout(resolve, 2))
    actionWorkflow.createAction('行动 C', skillId)
    const actionCId = action.activeActionId
    const actionC = action.actions.find(item => item.id === actionCId)
    actionC.totalTrees = 3
    actionC.forest = { t1: 3 }
    actionB.totalTrees = 2
    actionB.forest = { t1: 2 }
    notebook.createEssayNote('关联笔记', '行动合并验证', [actionCId])
    assert.equal(actionWorkflow.mergeActions(actionCId, actionBId), true)
    assert.equal(action.actions.find(item => item.id === actionBId).totalTrees, 5)
    assert.deepEqual(notebook.notebook[0].actionIds, [actionBId])

    action.createSkill('待删除技能')
    const deletedSkillId = action.skills.at(-1).id
    actionWorkflow.createAction('归属测试行动', deletedSkillId)
    const ownershipActionId = action.activeActionId
    const ownershipNote = notebook.createEssayNote('归属测试', '保留历史', [ownershipActionId])
    assert.equal(ownershipNote.skillId, deletedSkillId)
    assert.equal(actionWorkflow.deleteAction(ownershipActionId), true)
    assert.equal(notebook.notebook.find(note => note.id === ownershipNote.id).skillId, deletedSkillId)
    assert.equal(skillWorkflow.deleteSkill(deletedSkillId), true)
    const unclassifiedNote = notebook.notebook.find(note => note.id === ownershipNote.id)
    assert.equal(unclassifiedNote.skillId, null)
    assert.equal(unclassifiedNote.skillNameSnapshot, '待删除技能')

    const snapshot = save.getSaveData()
    assert.equal(snapshot.slotId, save.activeSlotId)
    assert.ok(Array.isArray(snapshot.actions))
    assert.ok(Array.isArray(snapshot.notebook))
    assert.equal(snapshot.timerMode, 'countup')
  } finally {
    rmSync(bundledStorePath, { force: true })
    delete globalThis.localStorage
  }
})
