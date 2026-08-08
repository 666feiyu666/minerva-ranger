import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { normalizeAction } from '@/local-backend/domain/actionModel'
import {
  createActionRecord,
  moveActionToSkill as moveActionToSkillList,
  reorderActions as reorderActionList,
} from '@/local-backend/services/actionService'
import {
  createSkillRecord,
  deleteSkillFromLists,
  renameSkillInList,
} from '@/local-backend/services/skillService'

export const useActionStore = defineStore('action', () => {
  const skills = ref([])
  const actions = ref([])
  const activeSkillId = ref(null)
  const activeActionId = ref(null)

  const activeAction = computed(() =>
    actions.value.find((action) => action.id === activeActionId.value),
  )
  const skillSummaries = computed(() =>
    skills.value.map((skill) => {
      const actions = actions.value.filter((action) => action.skillId === skill.id)
      return {
        ...skill,
        actionCount: actions.length,
        totalXP: actions.reduce((sum, action) => sum + (action.totalXP || 0), 0),
        totalTrees: actions.reduce((sum, action) => sum + (action.totalTrees || 0), 0),
        totalTimeSpent: actions.reduce((sum, action) => sum + (action.totalTimeSpent || 0), 0),
      }
    }),
  )

  function createSkill(name) {
    skills.value.push(createSkillRecord(name))
  }

  function renameSkill(id, newName) {
    return renameSkillInList(skills.value, id, newName)
  }

  function deleteSkill(id) {
    const result = deleteSkillFromLists(skills.value, actions.value, id)
    skills.value = result.nextSkills
    actions.value = result.nextActions
  }

  function addAction(name, skillId = null) {
    const action = createActionRecord(name, skillId)
    actions.value.push(action)
    return action
  }

  function renameAction(id, newName) {
    const action = actions.value.find((item) => item.id === id)
    if (action) action.name = newName
  }

  function reorderActions(sourceActionId, targetActionId, position = 'before') {
    const nextActions = reorderActionList(actions.value, sourceActionId, targetActionId, position)
    if (!nextActions) return false
    actions.value = nextActions
    return true
  }

  function moveActionToSkill(actionId, skillId = null) {
    const nextActions = moveActionToSkillList(actions.value, actionId, skillId)
    if (!nextActions) return false
    actions.value = nextActions
    return true
  }

  function replaceActions(nextActions) {
    actions.value = nextActions
  }

  function selectSkill(skillId) {
    activeSkillId.value = skillId || null
  }

  function selectAction(actionId) {
    activeActionId.value = actionId || null
  }

  function hydrateActionState(data = {}) {
    skills.value = (data.skills || []).map((skill) => ({
      ...skill,
      x: skill.x !== undefined ? skill.x : Math.floor(Math.random() * 70) + 15,
      y: skill.y !== undefined ? skill.y : Math.floor(Math.random() * 70) + 15,
    }))
    actions.value = (data.actions || []).map(normalizeAction)
    activeSkillId.value = data.activeSkillId || null
    activeActionId.value = data.activeActionId || null
  }

  function resetActionState() {
    skills.value = []
    actions.value = []
    activeSkillId.value = null
    activeActionId.value = null
  }

  function toActionSnapshot() {
    return {
      skills: skills.value,
      actions: actions.value,
      activeSkillId: activeSkillId.value,
      activeActionId: activeActionId.value,
    }
  }

  return {
    skills,
    actions,
    activeSkillId,
    activeActionId,
    activeAction,
    skillSummaries,
    createSkill,
    renameSkill,
    deleteSkill,
    addAction,
    renameAction,
    reorderActions,
    moveActionToSkill,
    replaceActions,
    selectSkill,
    selectAction,
    hydrateActionState,
    resetActionState,
    toActionSnapshot,
  }
})
