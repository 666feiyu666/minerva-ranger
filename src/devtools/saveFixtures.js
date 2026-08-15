import { MAP_LOCATIONS } from '@/config/mapCatalog'
import { createInitialMapState } from '@/local-backend/domain/mapModel'

const now = Date.now()

const iso = (secondsAgo) => new Date(now - secondsAgo * 1000).toISOString()

const note = ({
  id,
  title,
  content,
  actionIds,
  type = 'planting',
  source = 'user',
  eventType = null,
  coins = 10,
  secondsAgo = 3600,
}) => {
  const createdAt = iso(secondsAgo)
  return {
    id,
    title,
    content,
    type,
    source,
    eventType,
    actionIds,
    wordCount: content.replace(/\s/g, '').length,
    coins: source === 'user' ? coins : 0,
    createdAt,
    updatedAt: createdAt,
    date: new Date(createdAt).toLocaleString(),
  }
}

const baseSave = (overrides) => ({
  slotId: null,
  slotName: overrides.slotName,
  timestamp: now,
  coins: 0,
  globalXP: 0,
  unlockedTreeIds: ['t1'],
  ownedBoostIds: [],
  unlockedBackgroundIds: ['background_default'],
  skills: [],
  actions: [],
  notebook: [],
  map: createInitialMapState(MAP_LOCATIONS, now),
  activeView: 'forest',
  activeActionId: null,
  runningActionId: null,
  activeTreeId: null,
  isRunning: false,
  timer: 0,
  isNightMode: false,
  ...overrides,
})

const createMapFixtureState = ({
  availableTrees = {},
  unlockedLocationIds = ['ranger-camp'],
  discoveredLocationIds = null,
  selectedLocationId = unlockedLocationIds.at(-1) || 'ranger-camp',
  viewport = { x: 0, y: 0, scale: 1 },
}) => {
  const initial = createInitialMapState(MAP_LOCATIONS, now)
  const unlockedLocations = Object.fromEntries(
    unlockedLocationIds.map((locationId, index) => [
      locationId,
      {
        unlockedAt: new Date(now - index * 3600 * 1000).toISOString(),
        recipeSnapshot: {},
      },
    ]),
  )
  return {
    ...initial,
    availableTrees,
    unlockedLocations,
    discoveredLocationIds:
      discoveredLocationIds ||
      MAP_LOCATIONS.filter(
        (location) =>
          unlockedLocations[location.id] ||
          location.prerequisites?.some((locationId) => unlockedLocations[locationId]),
      ).map((location) => location.id),
    selectedLocationId,
    viewport,
  }
}

const mapFixtureActions = [
  {
    id: 'action_map_walk',
    name: '沿溪巡林',
    icon: '径',
    totalXP: 1800,
    totalTrees: 24,
    totalTimeSpent: 28800,
    forest: { t1: 16, t2: 4, t3: 3, t4: 1 },
    skillId: 'skill_map_world',
  },
]

const mapFixtureSkills = [{ id: 'skill_map_world', name: '理解自己的世界', x: 50, y: 50 }]

export const devSaveFixtures = [
  {
    id: 'map-fresh',
    name: 'Map Fresh',
    tag: 'Map 0.3',
    summary: 'Only the ranger camp is unlocked; all transplantable tree balances are zero.',
    createSave: () =>
      baseSave({
        slotName: 'DEV - Map Fresh',
        skills: mapFixtureSkills,
        actions: [],
        map: createMapFixtureState({ availableTrees: {} }),
        activeView: 'map',
      }),
  },
  {
    id: 'map-locked',
    name: 'Map Locked',
    tag: 'Map 0.3',
    summary: 'Several places are discovered, but current tree balances cannot unlock them.',
    createSave: () =>
      baseSave({
        slotName: 'DEV - Map Locked',
        skills: mapFixtureSkills,
        actions: mapFixtureActions,
        map: createMapFixtureState({ availableTrees: { t1: 0 } }),
        activeView: 'map',
      }),
  },
  {
    id: 'map-ready',
    name: 'Map Ready',
    tag: 'Map 0.3',
    summary: 'The forest gate and mist lake dock can both be unlocked immediately.',
    createSave: () =>
      baseSave({
        slotName: 'DEV - Map Ready',
        skills: mapFixtureSkills,
        actions: mapFixtureActions,
        map: createMapFixtureState({ availableTrees: { t1: 12, t2: 1, t3: 1 } }),
        activeView: 'map',
      }),
  },
  {
    id: 'map-progressed',
    name: 'Map Progressed',
    tag: 'Map 0.3',
    summary: 'Four places are unlocked and the scene gallery contains multiple illustrations.',
    createSave: () =>
      baseSave({
        slotName: 'DEV - Map Progressed',
        skills: mapFixtureSkills,
        actions: mapFixtureActions,
        map: createMapFixtureState({
          availableTrees: { t1: 14, t2: 3, t3: 2 },
          unlockedLocationIds: [
            'ranger-camp',
            'old-forest-gate',
            'mist-lake-dock',
            'moss-stone-courtyard',
          ],
          selectedLocationId: 'mist-lake-dock',
        }),
        activeView: 'map',
      }),
  },
  {
    id: 'map-complete',
    name: 'Map Complete',
    tag: 'Map 0.3',
    summary: 'All eight locations are unlocked for gallery and long-content review.',
    createSave: () =>
      baseSave({
        slotName: 'DEV - Map Complete',
        skills: mapFixtureSkills,
        actions: mapFixtureActions,
        map: createMapFixtureState({
          availableTrees: { t1: 28, t2: 8, t3: 10, t4: 2, t5: 2 },
          unlockedLocationIds: MAP_LOCATIONS.map((location) => location.id),
          selectedLocationId: 'golden-harbor',
        }),
        activeView: 'map',
      }),
  },
  {
    id: 'map-legacy',
    name: 'Map Legacy',
    tag: 'Migration',
    summary: 'A v0.2-style save with action forests and no map data, ready for migration checks.',
    createSave: () => {
      const save = baseSave({
        slotName: 'DEV - Map Legacy',
        skills: mapFixtureSkills,
        actions: mapFixtureActions,
        activeView: 'map',
      })
      delete save.map
      return save
    },
  },
  {
    id: 'fresh-ranger',
    name: 'Fresh Ranger',
    tag: 'Baseline',
    summary: 'Empty save with one starter skill for onboarding checks.',
    createSave: () =>
      baseSave({
        slotName: 'DEV - Fresh Ranger',
        skills: [{ id: 'skill_focus', name: 'Focus Lab', x: 34, y: 48 }],
        activeView: 'map',
      }),
  },
  {
    id: 'planner-midgame',
    name: 'Planner Midgame',
    tag: 'Design',
    summary: 'Several skills, mixed action levels, notes, and shop currency.',
    createSave: () =>
      baseSave({
        slotName: 'DEV - Planner Midgame',
        coins: 6800,
        globalXP: 4200,
        unlockedTreeIds: ['t1', 't2', 't3'],
        skills: [
          { id: 'skill_research', name: 'Research', x: 28, y: 36 },
          { id: 'skill_art', name: 'Art Direction', x: 62, y: 54 },
          { id: 'skill_systems', name: 'Systems', x: 46, y: 68 },
        ],
        actions: [
          {
            id: 'action_literature',
            name: 'Literature Review',
            icon: '📚',
            totalXP: 1320,
            totalTrees: 18,
            totalTimeSpent: 21600,
            forest: { t1: 12, t2: 6 },
            skillId: 'skill_research',
          },
          {
            id: 'action_map_style',
            name: 'World Map Style Pass',
            icon: '🗺️',
            totalXP: 2440,
            totalTrees: 27,
            totalTimeSpent: 31200,
            forest: { t1: 10, t2: 9, t3: 8 },
            skillId: 'skill_art',
          },
          {
            id: 'action_shop_curve',
            name: 'Shop Unlock Curve',
            icon: '⚖️',
            totalXP: 760,
            totalTrees: 9,
            totalTimeSpent: 9600,
            forest: { t1: 7, t2: 2 },
            skillId: 'skill_systems',
          },
        ],
        notebook: [
          note({
            id: 'note_map_style_01',
            title: '[植树日志] World Map Style Pass',
            content: 'Tested parchment map readability, landmark density, and skill node spacing.',
            actionIds: ['action_map_style'],
            secondsAgo: 7200,
          }),
          note({
            id: 'note_shop_curve_01',
            title: 'Shop pacing notes',
            content: 'Compare level gates against expected seven day progression.',
            actionIds: ['action_shop_curve'],
            type: 'essay',
            coins: 0,
            secondsAgo: 14400,
          }),
          note({
            id: 'note_merge_system',
            title: '[系统日志] 行动已合并',
            content: 'System fixture: merge log display and filtering state.',
            actionIds: ['action_literature'],
            type: 'system',
            source: 'system',
            eventType: 'action_merge',
            secondsAgo: 21600,
          }),
        ],
        activeView: 'dashboard',
        activeActionId: 'action_map_style',
        activeTreeId: 't3',
        isNightMode: false,
      }),
  },
  {
    id: 'forest-density',
    name: 'Forest Density',
    tag: 'Art',
    summary: 'Dense tree counts for testing forest composition and visual overlap.',
    createSave: () =>
      baseSave({
        slotName: 'DEV - Forest Density',
        coins: 24000,
        globalXP: 18600,
        unlockedTreeIds: ['t1', 't2', 't3', 't4', 't5'],
        skills: [
          { id: 'skill_dense', name: 'Dense Forest', x: 42, y: 40 },
          { id: 'skill_night', name: 'Night Palette', x: 70, y: 58 },
        ],
        actions: [
          {
            id: 'action_canopy',
            name: 'Canopy Stress Test',
            icon: '🌲',
            totalXP: 12800,
            totalTrees: 168,
            totalTimeSpent: 128400,
            forest: { t1: 58, t2: 46, t3: 34, t4: 22, t5: 8 },
            skillId: 'skill_dense',
          },
          {
            id: 'action_night_scene',
            name: 'Night Scene Contrast',
            icon: '🌙',
            totalXP: 5800,
            totalTrees: 74,
            totalTimeSpent: 68400,
            forest: { t1: 24, t2: 20, t3: 18, t4: 9, t5: 3 },
            skillId: 'skill_night',
          },
        ],
        notebook: [
          note({
            id: 'note_canopy_01',
            title: '[植树日志] Canopy Stress Test',
            content: 'Dense layout fixture for checking tree scale, lanes, and foreground balance.',
            actionIds: ['action_canopy'],
            secondsAgo: 5400,
          }),
          note({
            id: 'note_night_01',
            title: '[植树日志] Night Scene Contrast',
            content: 'Night mode fixture for reviewing brightness, silhouettes, and text contrast.',
            actionIds: ['action_night_scene'],
            secondsAgo: 9600,
          }),
        ],
        activeView: 'forest',
        activeActionId: 'action_canopy',
        activeSkillId: 'skill_dense',
        isNightMode: true,
      }),
  },
]
