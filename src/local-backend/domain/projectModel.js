import { deriveTotalXPFromLegacyProject, getProjectLevelState } from './leveling'

export function isSameProjectId(left, right) {
  return String(left) === String(right)
}

export function normalizeProject(project = {}) {
  const totalXP = deriveTotalXPFromLegacyProject(project)
  return {
    ...project,
    id: project.id,
    name: project.name || '未命名行动',
    icon: project.icon || '📁',
    totalXP,
    totalTrees: project.totalTrees || 0,
    totalTimeSpent: project.totalTimeSpent || 0,
    forest: project.forest || {},
    themeId: project.themeId || null,
    ...getProjectLevelState(totalXP)
  }
}
