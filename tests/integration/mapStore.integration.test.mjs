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

test('地图 Store 接入全局巡林官进度、身份切换与种树结算', async () => {
  const repoRoot = path.resolve(import.meta.dirname, '..')
  const bundledStorePath = path.join(tmpdir(), `mr-map-store-${Date.now()}.mjs`)
  const storage = new MemoryStorage()
  globalThis.localStorage = storage

  buildSync({
    stdin: {
      contents: `
        import { createPinia, setActivePinia } from 'pinia'
        import { useActionWorkflow } from '@/application/workflows/actionWorkflow'
        import { useActionStore } from '@/stores/actionStore'
        import { useMapStore } from '@/stores/mapStore'
        import { usePlantingStore } from '@/stores/plantingStore'
        import { useSaveStore } from '@/stores/saveStore'

        export function createArchitecture() {
          setActivePinia(createPinia())
          const save = useSaveStore()
          return {
            save,
            action: useActionStore(),
            map: useMapStore(),
            planting: usePlantingStore(),
            actionWorkflow: useActionWorkflow(),
          }
        }
      `,
      resolveDir: repoRoot,
      sourcefile: 'map-store-test-entry.mjs',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: bundledStorePath,
    loader: { '.png': 'dataurl' },
    define: { 'import.meta.env.DEV': 'false' },
    alias: { '@': path.join(repoRoot, 'src') },
  })

  try {
    const { createArchitecture } = await import(pathToFileURL(bundledStorePath).href)
    const first = createArchitecture()
    first.save.initSaveSystem()
    const legacySlotId = first.save.importSaveAsNewSlot(
      JSON.stringify({
        slotName: 'Legacy Map',
        coins: 0,
        globalXP: 0,
        unlockedTreeIds: ['t1'],
        skills: [{ id: 'skill_map', name: '地图研究' }],
        actions: [
          {
            id: 'action_map',
            name: '绘制地图',
            skillId: 'skill_map',
            totalTrees: 3,
            totalXP: 0,
            totalTimeSpent: 0,
            forest: { t1: 3 },
          },
        ],
        notebook: [],
      }),
    )
    assert.equal(first.save.enterSlot(legacySlotId), true)
    assert.equal(first.map.availableTrees.t1, 3)
    assert.equal(first.map.mapState.migratedFromLegacy, true)

    const unlock = first.map.unlockLocation('old-forest-gate')
    assert.equal(unlock.ok, true)
    assert.equal(first.map.availableTrees.t1, 2)
    assert.equal(first.action.actions[0].forest.t1, 3)
    assert.equal(first.map.unlockLocation('old-forest-gate').alreadyUnlocked, true)
    assert.equal(first.map.availableTrees.t1, 2)

    assert.equal(first.map.cumulativeTrees.t1, 3)
    assert.equal(first.map.mapState.unlockedLocations['old-forest-gate'].skillId, undefined)

    const secondSlotId = first.save.createSaveSlot('人类学研究者')
    assert.equal(first.save.enterSlot(secondSlotId), true)
    assert.deepEqual(first.action.actions, [])
    assert.equal(first.map.availableTrees.t1, 2)
    assert.ok(first.map.mapState.unlockedLocations['old-forest-gate'])

    first.actionWorkflow.createAction('继续巡林')
    const runningAction = first.action.actions.at(-1)
    first.planting.activeTreeId = 't1'
    first.planting.runningActionId = runningAction.id
    const mapBalanceBeforeCycle = first.map.availableTrees.t1
    first.planting.settleFinishedCycles()
    first.planting.timer = 25 * 60
    first.planting.settleFinishedCycles()
    assert.equal(first.map.availableTrees.t1, mapBalanceBeforeCycle + 1)
    assert.equal(first.map.cumulativeTrees.t1, 4)
    assert.equal(runningAction.forest.t1, 1)

    assert.equal(first.save.deleteSaveSlot(legacySlotId), true)
    assert.equal(first.map.cumulativeTrees.t1, 4)

    assert.equal(first.save.saveActiveSlot(false), true)
    const restored = createArchitecture()
    restored.save.initSaveSystem()
    assert.equal(restored.save.enterSlot(secondSlotId), true)
    assert.equal(restored.map.availableTrees.t1, first.map.availableTrees.t1)
    assert.equal(restored.map.cumulativeTrees.t1, 4)
    assert.equal(restored.map.mapState.unlockedLocations['old-forest-gate'].recipeSnapshot.t1, 1)

    restored.map.addTreeBalance('t1', 10)
    restored.save.saveActiveSlot(false)
    const balanceBeforeFailedUnlock = restored.map.availableTrees.t1
    storage.failWrites = true
    const originalConsoleError = console.error
    console.error = () => {}
    const failedUnlock = restored.map.unlockLocation('mist-lake-dock')
    console.error = originalConsoleError
    assert.equal(failedUnlock.error, 'save_failed')
    assert.equal(restored.map.availableTrees.t1, balanceBeforeFailedUnlock)
    assert.equal(restored.map.mapState.unlockedLocations['mist-lake-dock'], undefined)
  } finally {
    rmSync(bundledStorePath, { force: true })
    delete globalThis.localStorage
  }
})
