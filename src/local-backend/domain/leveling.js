import { ACTION_BASE_XP, ACTION_XP_GROWTH } from '@/config/gameBalance'

export function getGlobalLevelFromXP(xp = 0) {
  return Math.floor(Math.sqrt((xp || 0) / 100)) + 1
}

export function getActionLevelState(totalXP = 0) {
  let level = 1
  let nextLevelXP = ACTION_BASE_XP
  let currentXP = Math.max(0, Math.floor(totalXP))

  while (currentXP >= nextLevelXP) {
    currentXP -= nextLevelXP
    level += 1
    nextLevelXP = Math.floor(nextLevelXP * ACTION_XP_GROWTH)
  }

  return { level, currentXP, nextLevelXP }
}

export function deriveTotalXPFromLegacyAction(action = {}) {
  if (typeof action.totalXP === 'number' && Number.isFinite(action.totalXP)) {
    return Math.max(0, Math.floor(action.totalXP))
  }

  let totalXP = Math.max(0, Math.floor(action.currentXP || 0))
  let nextLevelXP = ACTION_BASE_XP
  const targetLevel = Math.max(1, Math.floor(action.level || 1))

  for (let level = 1; level < targetLevel; level += 1) {
    totalXP += nextLevelXP
    nextLevelXP = Math.floor(nextLevelXP * ACTION_XP_GROWTH)
  }

  return totalXP
}
