import { PROJECT_BASE_XP, PROJECT_XP_GROWTH } from '@/config/gameBalance'

export function getGlobalLevelFromXP(xp = 0) {
  return Math.floor(Math.sqrt((xp || 0) / 100)) + 1
}

export function getProjectLevelState(totalXP = 0) {
  let level = 1
  let nextLevelXP = PROJECT_BASE_XP
  let currentXP = Math.max(0, Math.floor(totalXP))

  while (currentXP >= nextLevelXP) {
    currentXP -= nextLevelXP
    level += 1
    nextLevelXP = Math.floor(nextLevelXP * PROJECT_XP_GROWTH)
  }

  return { level, currentXP, nextLevelXP }
}

export function deriveTotalXPFromLegacyProject(project = {}) {
  if (typeof project.totalXP === 'number' && Number.isFinite(project.totalXP)) {
    return Math.max(0, Math.floor(project.totalXP))
  }

  let totalXP = Math.max(0, Math.floor(project.currentXP || 0))
  let nextLevelXP = PROJECT_BASE_XP
  const targetLevel = Math.max(1, Math.floor(project.level || 1))

  for (let level = 1; level < targetLevel; level += 1) {
    totalXP += nextLevelXP
    nextLevelXP = Math.floor(nextLevelXP * PROJECT_XP_GROWTH)
  }

  return totalXP
}
