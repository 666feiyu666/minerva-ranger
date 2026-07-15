export function createEmptySaveData(slotId, slotName) {
  return {
    version: 2,
    slotId,
    slotName,
    timestamp: Date.now(),
    coins: 0,
    globalXP: 0,
    unlockedTreeIds: ['t1'],
    ownedBoostIds: [],
    unlockedBackgroundIds: ['background_default'],
    themes: [],
    projects: [],
    notebook: [],
    activeView: 'forest',
    activeThemeId: null,
    activeProjectId: null,
    runningProjectId: null,
    activeTreeId: null,
    isRunning: false,
    timer: 0,
    isNightMode: false
  }
}
