import { isSameActionId } from '@/local-backend/domain/actionModel'
import { deleteActionFromList, mergeActionData } from '@/local-backend/services/actionService'
import { useAppStore } from '@/stores/appStore'
import { useNotebookStore } from '@/stores/notebookStore'
import { usePlantingStore } from '@/stores/plantingStore'
import { useActionStore } from '@/stores/actionStore'

export function useActionWorkflow() {
  const appStore = useAppStore()
  const actionStore = useActionStore()
  const notebookStore = useNotebookStore()
  const plantingStore = usePlantingStore()

  function selectAction(actionId) {
    actionStore.selectAction(actionId)
    appStore.openDashboard()
  }

  function createAction(name, skillId = null) {
    const action = actionStore.addAction(name, skillId)
    selectAction(action.id)
    return action
  }

  function deleteAction(actionId, options = {}) {
    const targetAction = actionStore.actions.find((action) => isSameActionId(action.id, actionId))
    const skillName = actionStore.skills.find((skill) => skill.id === targetAction?.skillId)?.name || null
    const result = deleteActionFromList(
      actionStore.actions,
      notebookStore.notebook,
      actionId,
      { ...options, skillName },
    )
    if (!result) return false

    plantingStore.cancelRunningAction(actionId)
    if (isSameActionId(actionStore.activeActionId, actionId)) {
      actionStore.selectAction(null)
      appStore.openForest()
    }
    actionStore.replaceActions(result.nextActions)
    notebookStore.replaceNotebook(result.nextNotebook)
    notebookStore.createSystemNote(result.systemNote)
    return true
  }

  function mergeActions(sourceActionId, targetActionId, options = {}) {
    const targetAction = actionStore.actions.find((action) =>
      isSameActionId(action.id, targetActionId),
    )
    const targetSkillName =
      actionStore.skills.find((skill) => skill.id === targetAction?.skillId)?.name || null
    const result = mergeActionData(
      actionStore.actions,
      notebookStore.notebook,
      sourceActionId,
      targetActionId,
      { ...options, targetSkillName },
    )
    if (!result) return false

    if (isSameActionId(actionStore.activeActionId, sourceActionId)) {
      actionStore.selectAction(result.targetAction.id)
    }
    plantingStore.moveRunningAction(sourceActionId, result.targetAction.id)
    actionStore.replaceActions(result.nextActions)
    notebookStore.replaceNotebook(result.nextNotebook)
    notebookStore.createSystemNote(result.systemNote)
    return true
  }

  function openSkillForest(skillId) {
    actionStore.selectSkill(skillId)
    appStore.openForest()
  }

  function openForest() {
    actionStore.selectSkill(null)
    appStore.openForest()
  }

  return {
    selectAction,
    createAction,
    deleteAction,
    mergeActions,
    openSkillForest,
    openForest,
  }
}
