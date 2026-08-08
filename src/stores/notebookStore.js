import { defineStore } from 'pinia'
import { ref } from 'vue'
import { alertDialog } from '@/composables/dialogService'
import { normalizeNote } from '@/local-backend/domain/noteModel'
import {
  createNoteRecord,
  deleteUserNote,
  renameUserNote,
  updateUserNote,
  updateUserNoteTags,
} from '@/local-backend/services/notebookService'
import { usePlayerStore } from './playerStore'

export const useNotebookStore = defineStore('notebook', () => {
  const playerStore = usePlayerStore()
  const notebook = ref([])

  function createNote({
    title,
    content,
    actionIds = [],
    type = 'planting',
    source = 'user',
    eventType = null,
    awardCoins = source === 'user',
    id = Date.now(),
  }) {
    const result = createNoteRecord({
      title,
      content,
      actionIds,
      type,
      source,
      eventType,
      awardCoins,
      id,
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

  function createEssayNote(title, content, actionIds = []) {
    return createNote({
      title,
      content,
      actionIds,
      type: 'essay',
      source: 'user',
      awardCoins: false,
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
    const result = updateUserNote(
      notebook.value.find((note) => note.id === noteId),
      payload,
    )
    if (result.error) void alertDialog(result.error.message, { title: result.error.title })
    return result.ok
  }

  function deleteNote(noteId) {
    const result = deleteUserNote(notebook.value, noteId)
    if (result.coinRefund > 0) playerStore.removeCoins(result.coinRefund)
    return result.deleted
  }

  function updateNoteTags(noteId, newActionIds) {
    const note = notebook.value.find((item) => item.id === noteId)
    updateUserNoteTags(note, newActionIds)
  }

  function replaceNotebook(nextNotebook) {
    notebook.value = nextNotebook
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
    hydrateNotebookState,
    resetNotebookState,
    toNotebookSnapshot,
  }
})
