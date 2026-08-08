import test from 'node:test'
import assert from 'node:assert/strict'
import { rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { buildSync } from 'esbuild'

test('Store创建两种计时任务并按完整周期结算', async () => {
  const repoRoot = path.resolve(import.meta.dirname, '..')
  const bundledStorePath = path.join(tmpdir(), `mr-game-store-${Date.now()}.mjs`)

  buildSync({
    stdin: {
      contents: `
        import { createPinia, setActivePinia } from 'pinia'
        import { usePlantingStore } from '@/stores/plantingStore'
        import { useActionWorkflow } from '@/application/workflows/actionWorkflow'
        import { useActionStore } from '@/stores/actionStore'

        export function createTestArchitecture() {
          setActivePinia(createPinia())
          return {
            planting: usePlantingStore(),
            action: useActionStore(),
            actionWorkflow: useActionWorkflow()
          }
        }
      `,
      resolveDir: repoRoot,
      sourcefile: 'game-store-test-entry.mjs'
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
    const { planting, action, actionWorkflow } = createTestArchitecture()
    actionWorkflow.createAction('计时模式测试行动')

    const invalidCountdown = planting.startAction('t1', {
      mode: 'countdown',
      targetDuration: ''
    })
    assert.equal(invalidCountdown.ok, false)
    assert.equal(planting.runningActionId, null)

    const defaultCountup = planting.startAction('t1', {
      mode: 'countup',
      targetDuration: ''
    })
    assert.equal(defaultCountup.ok, true)
    assert.equal(planting.taskLimit, 3 * 60 * 60)
    planting.stopTimer()
    planting.timer = planting.taskLimit
    assert.equal(planting.taskTimeState.reachedLimit, true)
    planting.submitHarvest('')

    const countdown = planting.startAction('t1', {
      mode: 'countdown',
      targetDuration: 37 * 60
    })
    assert.equal(countdown.ok, true)
    assert.equal(planting.taskLimit, 37 * 60)
    planting.stopTimer()
    planting.timer = 25 * 60
    planting.submitHarvest('')

    assert.equal(action.actions[0].totalTrees, 8)
    assert.equal(action.actions[0].totalTimeSpent, 8 * 25 * 60)
  } finally {
    rmSync(bundledStorePath, { force: true })
  }
})
