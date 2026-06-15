const now = Date.now()

const iso = secondsAgo => new Date(now - secondsAgo * 1000).toISOString()

const note = ({
  id,
  title,
  content,
  projectIds,
  type = 'planting',
  source = 'user',
  eventType = null,
  coins = 10,
  secondsAgo = 3600
}) => {
  const createdAt = iso(secondsAgo)
  return {
    id,
    title,
    content,
    type,
    source,
    eventType,
    projectIds,
    wordCount: content.replace(/\s/g, '').length,
    coins: source === 'user' ? coins : 0,
    createdAt,
    updatedAt: createdAt,
    date: new Date(createdAt).toLocaleString()
  }
}

const baseSave = overrides => ({
  version: 2,
  slotId: null,
  slotName: overrides.slotName,
  timestamp: now,
  coins: 0,
  globalXP: 0,
  unlockedTreeIds: ['t1'],
  ownedBoostIds: [],
  unlockedBackgroundIds: ['background_default'],
  themes: [],
  projects: [],
  notebook: [],
  activeView: 'forest',
  activeProjectId: null,
  runningProjectId: null,
  activeTreeId: null,
  isRunning: false,
  timer: 0,
  isNightMode: false,
  ...overrides
})

export const devSaveFixtures = [
  {
    id: 'fresh-ranger',
    name: 'Fresh Ranger',
    tag: 'Baseline',
    summary: 'Empty save with one starter theme for onboarding checks.',
    createSave: () =>
      baseSave({
        slotName: 'DEV - Fresh Ranger',
        themes: [{ id: 'theme_focus', name: 'Focus Lab', x: 34, y: 48 }],
        activeView: 'map'
      })
  },
  {
    id: 'planner-midgame',
    name: 'Planner Midgame',
    tag: 'Design',
    summary: 'Several themes, mixed project levels, notes, and shop currency.',
    createSave: () =>
      baseSave({
        slotName: 'DEV - Planner Midgame',
        coins: 6800,
        globalXP: 4200,
        unlockedTreeIds: ['t1', 't2', 't3'],
        themes: [
          { id: 'theme_research', name: 'Research', x: 28, y: 36 },
          { id: 'theme_art', name: 'Art Direction', x: 62, y: 54 },
          { id: 'theme_systems', name: 'Systems', x: 46, y: 68 }
        ],
        projects: [
          {
            id: 'project_literature',
            name: 'Literature Review',
            icon: '📚',
            totalXP: 1320,
            totalTrees: 18,
            totalTimeSpent: 21600,
            forest: { t1: 12, t2: 6 },
            themeId: 'theme_research'
          },
          {
            id: 'project_map_style',
            name: 'World Map Style Pass',
            icon: '🗺️',
            totalXP: 2440,
            totalTrees: 27,
            totalTimeSpent: 31200,
            forest: { t1: 10, t2: 9, t3: 8 },
            themeId: 'theme_art'
          },
          {
            id: 'project_shop_curve',
            name: 'Shop Unlock Curve',
            icon: '⚖️',
            totalXP: 760,
            totalTrees: 9,
            totalTimeSpent: 9600,
            forest: { t1: 7, t2: 2 },
            themeId: 'theme_systems'
          }
        ],
        notebook: [
          note({
            id: 'note_map_style_01',
            title: '[植树日志] World Map Style Pass',
            content: 'Tested parchment map readability, landmark density, and theme node spacing.',
            projectIds: ['project_map_style'],
            secondsAgo: 7200
          }),
          note({
            id: 'note_shop_curve_01',
            title: 'Shop pacing notes',
            content: 'Compare level gates against expected seven day progression.',
            projectIds: ['project_shop_curve'],
            type: 'essay',
            coins: 0,
            secondsAgo: 14400
          }),
          note({
            id: 'note_merge_system',
            title: '[系统日志] 项目已合并',
            content: 'System fixture: merge log display and filtering state.',
            projectIds: ['project_literature'],
            type: 'system',
            source: 'system',
            eventType: 'project_merge',
            secondsAgo: 21600
          })
        ],
        activeView: 'dashboard',
        activeProjectId: 'project_map_style',
        activeTreeId: 't3',
        isNightMode: false
      })
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
        themes: [
          { id: 'theme_dense', name: 'Dense Forest', x: 42, y: 40 },
          { id: 'theme_night', name: 'Night Palette', x: 70, y: 58 }
        ],
        projects: [
          {
            id: 'project_canopy',
            name: 'Canopy Stress Test',
            icon: '🌲',
            totalXP: 12800,
            totalTrees: 168,
            totalTimeSpent: 128400,
            forest: { t1: 58, t2: 46, t3: 34, t4: 22, t5: 8 },
            themeId: 'theme_dense'
          },
          {
            id: 'project_night_scene',
            name: 'Night Scene Contrast',
            icon: '🌙',
            totalXP: 5800,
            totalTrees: 74,
            totalTimeSpent: 68400,
            forest: { t1: 24, t2: 20, t3: 18, t4: 9, t5: 3 },
            themeId: 'theme_night'
          }
        ],
        notebook: [
          note({
            id: 'note_canopy_01',
            title: '[植树日志] Canopy Stress Test',
            content: 'Dense layout fixture for checking tree scale, lanes, and foreground balance.',
            projectIds: ['project_canopy'],
            secondsAgo: 5400
          }),
          note({
            id: 'note_night_01',
            title: '[植树日志] Night Scene Contrast',
            content: 'Night mode fixture for reviewing brightness, silhouettes, and text contrast.',
            projectIds: ['project_night_scene'],
            secondsAgo: 9600
          })
        ],
        activeView: 'forest',
        activeProjectId: 'project_canopy',
        activeThemeId: 'theme_dense',
        isNightMode: true
      })
  }
]
