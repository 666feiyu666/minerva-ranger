import { getProjectLevelState } from '@/local-backend/domain/leveling'

export function getTreeYield(tree, project) {
  if (!tree || !project) return { trees: 0, xp: 0, multiplier: 1 }

  let multiplier = 1
  if (project.level >= 20) multiplier += 1
  if (project.level >= 50) multiplier += 1
  if (project.level >= 99) multiplier += 1

  return { trees: multiplier, xp: (tree.xp || 0) * multiplier, multiplier }
}

export function getFinishedCycles(timer = 0, tree = null) {
  const cycleTime = tree?.time || 0
  if (cycleTime <= 0) return 0
  return Math.floor(Math.max(0, timer) / cycleTime)
}

export function applyCompletedTreeCycles(project, tree, times = 1) {
  if (!project || !tree) return null

  const cycleCount = Math.max(0, Math.floor(times))
  if (cycleCount <= 0) {
    return { totalTrees: 0, totalXP: 0, yieldData: getTreeYield(tree, project) }
  }

  let totalTrees = 0
  let totalXP = 0
  let yieldData = getTreeYield(tree, project)

  if (!project.forest) project.forest = {}

  // Each cycle reads the level produced by the previous cycle. A batch restored
  // from offline time can therefore cross a multiplier boundary correctly.
  for (let cycle = 0; cycle < cycleCount; cycle += 1) {
    yieldData = getTreeYield(tree, project)
    totalTrees += yieldData.trees
    totalXP += yieldData.xp

    project.totalTrees = (project.totalTrees || 0) + yieldData.trees
    project.totalXP = (project.totalXP || 0) + yieldData.xp
    project.totalTimeSpent = (project.totalTimeSpent || 0) + (tree.time || 0)
    project.forest[tree.id] = (project.forest[tree.id] || 0) + yieldData.trees
    Object.assign(project, getProjectLevelState(project.totalXP))
  }

  return { totalTrees, totalXP, yieldData }
}

export function buildPlantingNoteInput(project, content) {
  if (!project || !content || content.trim().length <= 0) return null

  return {
    title: `[植树日志] ${project.name}`,
    content,
    projectIds: [project.id],
    type: 'planting',
    source: 'user'
  }
}
