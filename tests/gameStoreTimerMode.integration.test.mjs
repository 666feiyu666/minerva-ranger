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
        import { useGameStore } from '@/stores/gameStore'

        export function createTestGameStore() {
          setActivePinia(createPinia())
          return useGameStore()
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
      'import.meta.env.VITE_SYNC_API_URL': '""',
      'import.meta.env.DEV': 'false'
    },
    alias: { '@': path.join(repoRoot, 'src') }
  })

  try {
    const { createTestGameStore } = await import(pathToFileURL(bundledStorePath).href)
    const store = createTestGameStore()
    store.createProject('计时模式测试项目')

    const invalidCountdown = store.startAction('t1', {
      mode: 'countdown',
      targetDuration: ''
    })
    assert.equal(invalidCountdown.ok, false)
    assert.equal(store.runningProjectId, null)

    const defaultCountup = store.startAction('t1', {
      mode: 'countup',
      targetDuration: ''
    })
    assert.equal(defaultCountup.ok, true)
    assert.equal(store.taskLimit, 3 * 60 * 60)
    store.stopTimer()
    store.timer = store.taskLimit
    assert.equal(store.taskTimeState.reachedLimit, true)
    store.submitHarvest('')

    const countdown = store.startAction('t1', {
      mode: 'countdown',
      targetDuration: 37 * 60
    })
    assert.equal(countdown.ok, true)
    assert.equal(store.taskLimit, 37 * 60)
    store.stopTimer()
    store.timer = 25 * 60
    store.submitHarvest('')

    assert.equal(store.projects[0].totalTrees, 8)
    assert.equal(store.projects[0].totalTimeSpent, 8 * 25 * 60)
  } finally {
    rmSync(bundledStorePath, { force: true })
  }
})
