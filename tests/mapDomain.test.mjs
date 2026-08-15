import test from 'node:test'
import assert from 'node:assert/strict'

import {
  collectForestTreeCounts,
  createInitialMapState,
  getLocationStatus,
  normalizeMapState,
  unlockMapLocation,
  validateMapCatalog,
} from '../src/local-backend/domain/mapModel.js'

const LOCATIONS = [
  {
    id: 'camp',
    name: '营地',
    x: 20,
    y: 50,
    requirements: {},
    prerequisites: [],
    adjacent: ['gate', 'lake'],
    defaultUnlocked: true,
  },
  {
    id: 'gate',
    name: '林门',
    x: 40,
    y: 50,
    requirements: { t1: 1 },
    prerequisites: ['camp'],
    adjacent: ['camp', 'ruins'],
    defaultUnlocked: false,
  },
  {
    id: 'lake',
    name: '湖泊',
    x: 60,
    y: 50,
    requirements: { t1: 2 },
    prerequisites: ['camp'],
    adjacent: ['camp', 'ruins'],
    defaultUnlocked: false,
  },
  {
    id: 'ruins',
    name: '遗迹',
    x: 80,
    y: 50,
    requirements: { t2: 1 },
    prerequisites: ['gate', 'lake'],
    prerequisiteMode: 'all',
    adjacent: ['gate', 'lake'],
    defaultUnlocked: false,
  },
]

test('地图领域模型计算四态、迁移旧树木并执行幂等解锁', async (t) => {
  await t.test('有效配置必须包含起点、有效坐标且没有前置循环', () => {
    assert.deepEqual(validateMapCatalog(LOCATIONS), { ok: true, errors: [] })
    const cyclic = LOCATIONS.map((location) => ({ ...location }))
    cyclic[0].prerequisites = ['ruins']
    assert.equal(validateMapCatalog(cyclic).ok, false)
  })

  await t.test('旧存档森林只迁移一次且修复非法计数', () => {
    const actions = [{ forest: { t1: 3, t2: 1, damaged: -4 } }, { forest: { t1: 2, unknown: '2' } }]
    assert.deepEqual(collectForestTreeCounts(actions), {
      t1: 5,
      t2: 1,
      damaged: 0,
      unknown: 2,
    })

    const migrated = normalizeMapState({ mapData: null, actions, locations: LOCATIONS, now: 0 })
    assert.equal(migrated.migratedFromLegacy, true)
    assert.deepEqual(migrated.availableTrees, {
      t1: 5,
      t2: 1,
      damaged: 0,
      unknown: 2,
    })
    assert.deepEqual(migrated.cumulativeTrees, migrated.availableTrees)

    const normalizedAgain = normalizeMapState({
      mapData: { ...migrated, availableTrees: { t1: 4 } },
      actions,
      locations: LOCATIONS,
      now: 1000,
    })
    assert.deepEqual(normalizedAgain.availableTrees, { t1: 4 })
    assert.equal(normalizedAgain.cumulativeTrees.t1, 5)
  })

  await t.test('v1 地图升级后移除地点与 Skill 的历史关联', () => {
    const normalized = normalizeMapState({
      mapData: {
        version: 1,
        availableTrees: { t1: 1 },
        unlockedLocations: {
          camp: {
            unlockedAt: new Date(0).toISOString(),
            recipeSnapshot: {},
            skillId: 'legacy-skill',
            skillNameSnapshot: '旧技能',
          },
        },
      },
      actions: [{ forest: { t1: 2 } }],
      locations: LOCATIONS,
      now: 0,
    })

    assert.equal(normalized.version, 2)
    assert.equal(normalized.unlockedLocations.camp.skillId, undefined)
    assert.deepEqual(normalized.cumulativeTrees, { t1: 2 })
  })

  await t.test('地点通过形态状态区分发现、可解锁与已解锁', () => {
    const state = createInitialMapState(LOCATIONS, 0)
    assert.equal(getLocationStatus(LOCATIONS[0], state), 'unlocked')
    assert.equal(getLocationStatus(LOCATIONS[1], state), 'discovered')
    assert.equal(getLocationStatus(LOCATIONS[3], state), 'undiscovered')
    state.availableTrees = { t1: 1 }
    assert.equal(getLocationStatus(LOCATIONS[1], state), 'ready')
  })

  await t.test('解锁一次扣除一次，并在全部前置满足后发现遗迹', () => {
    const initial = createInitialMapState(LOCATIONS, 0)
    initial.availableTrees = { t1: 3, t2: 1 }

    const gateResult = unlockMapLocation({
      mapState: initial,
      locationId: 'gate',
      locations: LOCATIONS,
      now: 1000,
    })
    assert.equal(gateResult.ok, true)
    assert.equal(gateResult.mapState.availableTrees.t1, 2)
    assert.equal(gateResult.mapState.discoveredLocationIds.includes('ruins'), false)

    const repeated = unlockMapLocation({
      mapState: gateResult.mapState,
      locationId: 'gate',
      locations: LOCATIONS,
      now: 2000,
    })
    assert.equal(repeated.alreadyUnlocked, true)
    assert.equal(repeated.mapState.availableTrees.t1, 2)

    const lakeResult = unlockMapLocation({
      mapState: gateResult.mapState,
      locationId: 'lake',
      locations: LOCATIONS,
      now: 3000,
    })
    assert.equal(lakeResult.ok, true)
    assert.equal(lakeResult.mapState.availableTrees.t1, 0)
    assert.equal(lakeResult.mapState.discoveredLocationIds.includes('ruins'), true)
  })
})
