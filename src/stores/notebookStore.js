import { defineStore } from 'pinia'
import { ref } from 'vue'
import { alertDialog } from '@/composables/dialogService'
import { normalizeNote, toActionIds } from '@/local-backend/domain/noteModel'
import {
  createNoteRecord,
  deleteUserNote,
  migrateNotesForDeletedAction,
  migrateNotesForDeletedSkill,
  renameUserNote,
  syncNotesForActionOwnership,
  updateUserNote,
  updateUserNoteTags,
} from '@/local-backend/services/notebookService'
import { useActionStore } from './actionStore'
import { usePlayerStore } from './playerStore'

export const useNotebookStore = defineStore('notebook', () => {
  const playerStore = usePlayerStore()
  const actionStore = useActionStore()
  const notebook = ref([])

  function createNoteId() {
    return `note_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }

  function resolveOwnership({
    actionIds = [],
    skillId = null,
    actionNameSnapshot = null,
    skillNameSnapshot = null,
  }) {
    const normalizedActionIds = toActionIds(actionIds)
    const primaryAction = actionStore.actions.find(
      (action) => String(action.id) === String(normalizedActionIds[0]),
    )
    const resolvedSkillId = primaryAction ? primaryAction.skillId || null : skillId || null
    const resolvedSkill = actionStore.skills.find(
      (skill) => String(skill.id) === String(resolvedSkillId),
    )

    return {
      actionIds: normalizedActionIds,
      skillId: resolvedSkillId,
      actionNameSnapshot: primaryAction?.name || actionNameSnapshot,
      skillNameSnapshot: resolvedSkill?.name || skillNameSnapshot,
    }
  }

  function createNote({
    title,
    content,
    actionIds = [],
    skillId = null,
    type = 'planting',
    source = 'user',
    eventType = null,
    awardCoins = source === 'user',
    allowEmptyContent = false,
    id = null,
    sessionId = null,
    actionNameSnapshot = null,
    skillNameSnapshot = null,
    ...metadata
  }) {
    if (sessionId) {
      const existing = notebook.value.find((note) => note.sessionId === sessionId)
      if (existing) return existing
    }

    const ownership = resolveOwnership({
      actionIds,
      skillId,
      actionNameSnapshot,
      skillNameSnapshot,
    })
    const result = createNoteRecord({
      title,
      content,
      ...ownership,
      type,
      source,
      eventType,
      awardCoins,
      allowEmptyContent,
      id: id || (sessionId ? `planting_${sessionId}` : createNoteId()),
      sessionId,
      ...metadata,
    })

    if (result.error) {
      void alertDialog(result.error.message, { title: result.error.title })
      return null
    }

    if (result.earnedCoins > 0) playerStore.addCoins(result.earnedCoins)
    notebook.value.unshift(result.note)
    return result.note
  }

  function uploadNote(title, content, actionIds = []) {
    return createNote({ title, content, actionIds, type: 'planting', source: 'user' })
  }

  function createEssayNote(title, content, actionIds = [], options = {}) {
    return createNote({
      title,
      content,
      actionIds,
      ...options,
      type: 'essay',
      source: 'user',
      awardCoins: false,
      contentFormat: 'markdown',
    })
  }

  function createSystemNote({ title, content, actionIds = [], eventType = null }) {
    return createNote({
      title,
      content,
      actionIds,
      type: 'system',
      source: 'system',
      eventType,
      awardCoins: false,
    })
  }

  function renameNote(noteId, newTitle) {
    return renameUserNote(
      notebook.value.find((note) => note.id === noteId),
      newTitle,
    )
  }

  function updateNote(noteId, payload = {}) {
    const note = notebook.value.find((item) => item.id === noteId)
    const nextPayload = { ...payload }
    if (note && (payload.actionIds !== undefined || payload.skillId !== undefined)) {
      Object.assign(
        nextPayload,
        resolveOwnership({
          actionIds: payload.actionIds !== undefined ? payload.actionIds : note.actionIds,
          skillId: payload.skillId !== undefined ? payload.skillId : note.skillId,
          actionNameSnapshot: note.actionNameSnapshot,
          skillNameSnapshot: note.skillNameSnapshot,
        }),
      )
    }
    const result = updateUserNote(note, nextPayload)
    if (result.error) void alertDialog(result.error.message, { title: result.error.title })
    return result.ok
  }

  function deleteNote(noteId) {
    const result = deleteUserNote(notebook.value, noteId)
    return result.deleted
  }

  function updateNoteTags(noteId, newActionIds) {
    const note = notebook.value.find((item) => item.id === noteId)
    updateUserNoteTags(note, newActionIds)
  }

  function replaceNotebook(nextNotebook) {
    notebook.value = nextNotebook.map(normalizeNote)
  }

  function migrateDeletedAction(action, options = {}) {
    notebook.value = migrateNotesForDeletedAction(notebook.value, action, options)
  }

  function syncActionOwnership(actionId) {
    const action = actionStore.actions.find((item) => String(item.id) === String(actionId))
    if (!action) return false
    const skillName = actionStore.skills.find((skill) => skill.id === action.skillId)?.name || null
    notebook.value = syncNotesForActionOwnership(notebook.value, action, { skillName })
    return true
  }

  function migrateDeletedSkill(skill) {
    notebook.value = migrateNotesForDeletedSkill(notebook.value, skill)
  }

  function hydrateNotebookState(data = {}) {
    notebook.value = (data.notebook || []).map(normalizeNote)
  }

  function resetNotebookState() {
    notebook.value = []
  }

  function toNotebookSnapshot() {
    return { notebook: notebook.value }
  }

  return {
    notebook,
    createNote,
    uploadNote,
    createEssayNote,
    createSystemNote,
    renameNote,
    updateNote,
    deleteNote,
    updateNoteTags,
    replaceNotebook,
    migrateDeletedAction,
    syncActionOwnership,
    migrateDeletedSkill,
    hydrateNotebookState,
    resetNotebookState,
    toNotebookSnapshot,
  }
})
