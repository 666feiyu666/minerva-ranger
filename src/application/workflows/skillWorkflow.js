import { useNotebookStore } from '@/stores/notebookStore'
import { useActionStore } from '@/stores/actionStore'

export function useSkillWorkflow() {
  const actionStore = useActionStore()
  const notebookStore = useNotebookStore()

  function deleteSkill(skillId) {
    const skill = actionStore.skills.find((item) => item.id === skillId)
    if (!skill) return false
    const affectedActionIds = actionStore.actions
      .filter((item) => item.skillId === skillId)
      .map((item) => item.id)

    actionStore.deleteSkill(skillId)
    affectedActionIds.forEach((actionId) => notebookStore.syncActionOwnership(actionId))
    notebookStore.migrateDeletedSkill(skill)
    return true
  }

  function moveActionToSkill(actionId, skillId = null) {
    const moved = actionStore.moveActionToSkill(actionId, skillId)
    if (!moved) return false
    notebookStore.syncActionOwnership(actionId)
    return true
  }

  return {
    deleteSkill,
    moveActionToSkill,
  }
}
