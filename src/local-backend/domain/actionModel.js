import { deriveTotalXPFromLegacyAction, getActionLevelState } from './leveling'

export function isSameActionId(left, right) {
  return String(left) === String(right)
}

export function normalizeAction(action = {}) {
  const totalXP = deriveTotalXPFromLegacyAction(action)
  return {
    ...action,
    id: action.id,
    name: action.name || '未命名行动',
    icon: action.icon || '📁',
    totalXP,
    totalTrees: action.totalTrees || 0,
    totalTimeSpent: action.totalTimeSpent || 0,
    forest: action.forest || {},
    skillId: action.skillId || null,
    ...getActionLevelState(totalXP),
  }
}
