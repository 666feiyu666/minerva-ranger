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

  const yieldData = getTreeYield(tree, project)
  const totalTrees = yieldData.trees * cycleCount
  const totalXP = yieldData.xp * cycleCount

  project.totalTrees = (project.totalTrees || 0) + totalTrees
  project.totalXP = (project.totalXP || 0) + totalXP
  Object.assign(project, getProjectLevelState(project.totalXP))

  if (!project.forest) project.forest = {}
  project.forest[tree.id] = (project.forest[tree.id] || 0) + totalTrees

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
