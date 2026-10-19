import test from 'node:test'
import assert from 'node:assert/strict'

import {
  mergeLegacySaveIntoRangerProfile,
  mergeRangerProfiles,
  migrateLegacySlotsToRangerProfile,
} from '../src/local-backend/domain/rangerProfile.js'

const LOCATIONS = [
  {
    id: 'camp',
    name: '营地',
    x: 20,
    y: 50,
    requirements: {},
    prerequisites: [],
    adjacent: ['gate'],
    defaultUnlocked: true,
  },
  {
    id: 'gate',
    name: '林门',
    x: 50,
    y: 50,
    requirements: { t1: 1 },
    prerequisites: ['camp'],
    adjacent: ['camp'],
    defaultUnlocked: false,
  },
]

const unlockedMap = (availableTrees, unlockedAt) => ({
  version: 1,
  availableTrees,
  unlockedLocations: {
    camp: { unlockedAt: new Date(0).toISOString(), recipeSnapshot: {} },
    gate: {
      unlockedAt,
      recipeSnapshot: { t1: 1 },
      skillId: 'legacy-skill',
      skillNameSnapshot: '旧关联',
    },
  },
  discoveredLocationIds: ['camp', 'gate'],
  selectedLocationId: 'gate',
  viewport: { x: 0, y: 0, scale: 1 },
})

test('旧身份合并为一个全局巡林官档案并保留贡献来源数据', () => {
  const first = {
    slotId: 'designer',
    coins: 10,
    globalXP: 100,
    unlockedTreeIds: ['t1', 't2'],
    actions: [{ forest: { t1: 3 } }],
    map: unlockedMap({ t1: 2 }, new Date(1000).toISOString()),
  }
  const second = {
    slotId: 'anthropologist',
    coins: 20,
    globalXP: 200,
    unlockedTreeIds: ['t1', 't3'],
    actions: [{ forest: { t1: 4 } }],
    map: unlockedMap({ t1: 3 }, new Date(2000).toISOString()),
  }

  const profile = migrateLegacySlotsToRangerProfile(
    [
      { slotId: first.slotId, saveData: first },
      { slotId: second.slotId, saveData: second },
    ],
    LOCATIONS,
    3000,
  )

  assert.equal(profile.coins, 30)
  assert.equal(profile.globalXP, 300)
  assert.deepEqual(profile.unlockedTreeIds, ['t1', 't2', 't3'])
  assert.deepEqual(profile.map.cumulativeTrees, { t1: 7 })
  assert.deepEqual(profile.map.availableTrees, { t1: 6 })
  assert.equal(profile.map.unlockedLocations.gate.unlockedAt, new Date(1000).toISOString())
  assert.equal(profile.map.unlockedLocations.gate.skillId, undefined)
  assert.deepEqual(profile.migratedLegacySourceIds.sort(), ['slot:anthropologist', 'slot:designer'])
})

test('同一旧身份或同一巡林官备份不会被重复合并', () => {
  const legacy = {
    slotId: 'designer',
    coins: 10,
    globalXP: 100,
    unlockedTreeIds: ['t1'],
    actions: [{ forest: { t1: 3 } }],
  }
  const once = migrateLegacySlotsToRangerProfile(
    [{ slotId: legacy.slotId, saveData: legacy }],
    LOCATIONS,
    1000,
  )
  const twice = mergeLegacySaveIntoRangerProfile(once, legacy, LOCATIONS, 'slot:designer', 2000)
  const sameProfile = mergeRangerProfiles(twice, twice, LOCATIONS, 3000)

  assert.equal(twice.coins, 10)
  assert.equal(twice.globalXP, 100)
  assert.deepEqual(twice.map.cumulativeTrees, { t1: 3 })
  assert.deepEqual(sameProfile, twice)
})
