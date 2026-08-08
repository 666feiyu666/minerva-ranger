export const SAVE_DATA_VERSION = 3

export function createEmptySaveData(slotId, slotName, options = {}) {
  const createdAt = Date.now()
  const defaultSkills = options.includeDefaultSkills
    ? ['写代码', '做设计', '推广与宣传'].map((name, index) => ({
        id: `${createdAt}-${index}`,
        name,
        x: 24 + index * 26,
        y: index === 1 ? 62 : 36,
      }))
    : []

  return {
    version: SAVE_DATA_VERSION,
    slotId,
    slotName,
    timestamp: Date.now(),
    coins: 0,
    globalXP: 0,
    unlockedTreeIds: ['t1'],
    ownedBoostIds: [],
    unlockedBackgroundIds: ['background_default'],
    skills: defaultSkills,
    actions: [],
    notebook: [],
    activeView: 'forest',
    activeSkillId: null,
    activeActionId: null,
    runningActionId: null,
    activeTreeId: null,
    isRunning: false,
    timer: 0,
    settledCycles: 0,
    taskTrees: 0,
    taskXP: 0,
    taskStartLevel: null,
    timerMode: 'countup',
    targetDuration: 3 * 60 * 60,
    isNightMode: false,
  }
}
