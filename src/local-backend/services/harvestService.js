import { getActionLevelState } from '@/local-backend/domain/leveling'

export function getTreeYield(tree, action) {
  if (!tree || !action) return { trees: 0, xp: 0, multiplier: 1 }

  let multiplier = 1
  if (action.level >= 20) multiplier += 1
  if (action.level >= 50) multiplier += 1
  if (action.level >= 99) multiplier += 1

  return { trees: multiplier, xp: (tree.xp || 0) * multiplier, multiplier }
}

export function getFinishedCycles(timer = 0, tree = null) {
  const cycleTime = tree?.time || 0
  if (cycleTime <= 0) return 0
  return Math.floor(Math.max(0, timer) / cycleTime)
}

export function applyCompletedTreeCycles(action, tree, times = 1) {
  if (!action || !tree) return null

  const cycleCount = Math.max(0, Math.floor(times))
  if (cycleCount <= 0) {
    return { totalTrees: 0, totalXP: 0, yieldData: getTreeYield(tree, action) }
  }

  let totalTrees = 0
  let totalXP = 0
  let yieldData = getTreeYield(tree, action)

  if (!action.forest) action.forest = {}

  // Each cycle reads the level produced by the previous cycle. A batch restored
  // from offline time can therefore cross a multiplier boundary correctly.
  for (let cycle = 0; cycle < cycleCount; cycle += 1) {
    yieldData = getTreeYield(tree, action)
    totalTrees += yieldData.trees
    totalXP += yieldData.xp

    action.totalTrees = (action.totalTrees || 0) + yieldData.trees
    action.totalXP = (action.totalXP || 0) + yieldData.xp
    action.totalTimeSpent = (action.totalTimeSpent || 0) + (tree.time || 0)
    action.forest[tree.id] = (action.forest[tree.id] || 0) + yieldData.trees
    Object.assign(action, getActionLevelState(action.totalXP))
  }

  return { totalTrees, totalXP, yieldData }
}

export function buildPlantingNoteInput(actionOrOptions, legacyContent = '') {
  const options = actionOrOptions?.action
    ? actionOrOptions
    : { action: actionOrOptions, content: legacyContent }
  const {
    action,
    skill = null,
    tree = null,
    content = '',
    sessionId = null,
    startedAt = null,
    endedAt = null,
    durationSeconds = 0,
    completedCycles = 0,
    treesEarned = 0,
    xpEarned = 0,
    endReason = 'manual',
  } = options

  if (!action) return null
  const hasContent = content.trim().length > 0

  return {
    title: `[植树日志] ${action.name}`,
    content,
    actionIds: [action.id],
    skillId: action.skillId || null,
    type: 'planting',
    source: 'user',
    allowEmptyContent: true,
    awardCoins: hasContent,
    sessionId,
    actionNameSnapshot: action.name,
    skillNameSnapshot: skill?.name || null,
    treeId: tree?.id || null,
    treeNameSnapshot: tree?.name || null,
    startedAt,
    endedAt,
    durationSeconds,
    completedCycles,
    treesEarned,
    xpEarned,
    endReason,
  }
}
