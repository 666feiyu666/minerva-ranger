import { deriveTotalXPFromLegacyAction, getActionLevelState } from '@/local-backend/domain/leveling'
import { normalizeNote } from '@/local-backend/domain/noteModel'
import { isSameActionId, normalizeAction } from '@/local-backend/domain/actionModel'

export function createActionRecord(name, skillId = null, id = Date.now()) {
  return normalizeAction({
    id: `action_${id}`,
    name,
    icon: '📁',
    totalXP: 0,
    totalTrees: 0,
    totalTimeSpent: 0,
    forest: {},
    skillId,
  })
}

export function deleteActionFromList(actions, notebook, actionId, options = {}) {
  const targetAction = actions.find((action) => isSameActionId(action.id, actionId))
  if (!targetAction) return null

  const commitMessage = options.commitMessage?.trim()
  const relatedLogCount = notebook.filter((note) =>
    normalizeNote(note).actionIds.some((noteActionId) => isSameActionId(noteActionId, actionId)),
  ).length

  return {
    nextActions: actions.filter((action) => !isSameActionId(action.id, actionId)),
    deletedAction: targetAction,
    systemNote: {
      title: '[系统记录] 行动已删除',
      eventType: 'action_delete',
      content: [
        '系统记录：行动删除完成。',
        `删除行动：${targetAction.name}`,
        `删除前树木：${targetAction.totalTrees || 0} 棵`,
        `删除前时长：${Math.floor(targetAction.totalTimeSpent || 0)} 秒`,
        `删除前经验：${deriveTotalXPFromLegacyAction(targetAction)} XP`,
        `关联日志：${relatedLogCount} 条`,
        commitMessage ? `用户说明：${commitMessage}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    },
  }
}

export function mergeActionData(actions, notebook, sourceActionId, targetActionId, options = {}) {
  if (!sourceActionId || !targetActionId || isSameActionId(sourceActionId, targetActionId)) {
    return null
  }

  const sourceAction = actions.find((action) => isSameActionId(action.id, sourceActionId))
  const targetAction = actions.find((action) => isSameActionId(action.id, targetActionId))
  if (!sourceAction || !targetAction) return null

  const commitMessage = options.commitMessage?.trim()
  const mergedTargetAction = {
    ...targetAction,
    totalTrees: (targetAction.totalTrees || 0) + (sourceAction.totalTrees || 0),
    totalTimeSpent: (targetAction.totalTimeSpent || 0) + (sourceAction.totalTimeSpent || 0),
    totalXP:
      deriveTotalXPFromLegacyAction(targetAction) + deriveTotalXPFromLegacyAction(sourceAction),
    forest: { ...targetAction.forest },
  }

  Object.entries(sourceAction.forest || {}).forEach(([treeId, count]) => {
    mergedTargetAction.forest[treeId] = (mergedTargetAction.forest[treeId] || 0) + count
  })
  Object.assign(mergedTargetAction, getActionLevelState(mergedTargetAction.totalXP))

  let migratedLogCount = 0
  const nextNotebook = notebook.map((note) => {
    const normalized = normalizeNote(note)
    if (
      !normalized.actionIds.some((noteActionId) => isSameActionId(noteActionId, sourceActionId))
    ) {
      return normalized
    }

    migratedLogCount += 1
    normalized.actionIds = [
      ...new Set(
        normalized.actionIds.map((noteActionId) =>
          isSameActionId(noteActionId, sourceActionId) ? targetAction.id : noteActionId,
        ),
      ),
    ]
    return normalized
  })

  return {
    nextActions: actions
      .filter((action) => !isSameActionId(action.id, sourceActionId))
      .map((action) => (isSameActionId(action.id, targetActionId) ? mergedTargetAction : action)),
    nextNotebook,
    sourceAction,
    targetAction: mergedTargetAction,
    systemNote: {
      title: '[系统记录] 行动已合并',
      actionIds: [targetActionId],
      eventType: 'action_merge',
      content: [
        '系统记录：行动合并完成。',
        `源行动：${sourceAction.name}`,
        `目标行动：${targetAction.name}`,
        `迁移树木：${sourceAction.totalTrees || 0} 棵`,
        `迁移时长：${Math.floor(sourceAction.totalTimeSpent || 0)} 秒`,
        `迁移经验：${deriveTotalXPFromLegacyAction(sourceAction)} XP`,
        `迁移日志：${migratedLogCount} 条`,
        commitMessage ? `用户说明：${commitMessage}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    },
  }
}

export function reorderActions(actions, sourceActionId, targetActionId, position = 'before') {
  if (!sourceActionId || !targetActionId || isSameActionId(sourceActionId, targetActionId)) {
    return null
  }

  const nextActions = [...actions]
  const sourceIndex = nextActions.findIndex((action) => isSameActionId(action.id, sourceActionId))
  const targetIndex = nextActions.findIndex((action) => isSameActionId(action.id, targetActionId))
  if (sourceIndex === -1 || targetIndex === -1) return null

  const [movedAction] = nextActions.splice(sourceIndex, 1)
  const targetAction = nextActions.find((action) => isSameActionId(action.id, targetActionId))
  if (!movedAction || !targetAction) return null

  movedAction.skillId = targetAction.skillId || null

  const insertIndex =
    nextActions.findIndex((action) => isSameActionId(action.id, targetActionId)) +
    (position === 'after' ? 1 : 0)

  nextActions.splice(insertIndex, 0, movedAction)
  return nextActions
}

export function moveActionToSkill(actions, actionId, skillId = null) {
  const nextActions = [...actions]
  const sourceIndex = nextActions.findIndex((action) => isSameActionId(action.id, actionId))
  if (sourceIndex === -1) return null

  const [movedAction] = nextActions.splice(sourceIndex, 1)
  if (!movedAction) return null

  movedAction.skillId = skillId || null

  const lastSkillIndex = (() => {
    if (!skillId) {
      return nextActions.reduce(
        (index, action, currentIndex) => (!action.skillId ? currentIndex : index),
        -1,
      )
    }

    return nextActions.reduce(
      (index, action, currentIndex) => (action.skillId === skillId ? currentIndex : index),
      -1,
    )
  })()

  nextActions.splice(lastSkillIndex + 1, 0, movedAction)
  return nextActions
}
