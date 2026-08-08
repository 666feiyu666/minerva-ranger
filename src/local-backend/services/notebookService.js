import { normalizeNote, toActionIds } from '@/local-backend/domain/noteModel'

export function createNoteRecord({
  title,
  content,
  actionIds = [],
  type = 'planting',
  source = 'user',
  eventType = null,
  awardCoins = source === 'user',
  id = Date.now(),
  now = new Date(),
}) {
  const cleanContent = (content || '').replace(/\s/g, '')
  const wordCount = cleanContent.length

  if (source === 'user' && wordCount <= 0) {
    return {
      note: null,
      earnedCoins: 0,
      error: {
        title: '内容无效',
        message: type === 'planting' ? '未记录笔记，未能获得金币！' : '内容不能为空',
      },
    }
  }

  const earnedCoins = awardCoins ? 10 : 0
  const createdAt = now.toISOString()
  const note = normalizeNote({
    id,
    title,
    content,
    type,
    source,
    eventType,
    actionIds,
    wordCount,
    coins: earnedCoins,
    createdAt,
    updatedAt: createdAt,
    date: now.toLocaleString(),
  })

  return { note, earnedCoins, error: null }
}

export function renameUserNote(note, newTitle, now = new Date()) {
  if (!note || note.source === 'system') return false
  note.title = newTitle
  note.updatedAt = now.toISOString()
  note.date = now.toLocaleString()
  return true
}

export function updateUserNote(note, payload = {}, now = new Date()) {
  if (!note || note.source === 'system') return { ok: false }

  if (typeof payload.content === 'string') {
    const cleanContent = payload.content.replace(/\s/g, '')
    if (cleanContent.length <= 0) {
      return {
        ok: false,
        error: {
          title: '内容无效',
          message: '日志内容不能为空',
        },
      }
    }
    note.content = payload.content
    note.wordCount = cleanContent.length
  }

  if (typeof payload.title === 'string' && payload.title.trim()) {
    note.title = payload.title.trim()
  }

  if (payload.actionIds !== undefined) {
    note.actionIds = toActionIds(payload.actionIds)
  }

  note.updatedAt = now.toISOString()
  note.date = now.toLocaleString()
  return { ok: true }
}

export function deleteUserNote(notebook, noteId) {
  const index = notebook.findIndex((note) => note.id === noteId)
  if (index === -1) return { deleted: false, coinRefund: 0 }

  const note = notebook[index]
  if (note.source === 'system') return { deleted: false, coinRefund: 0 }

  notebook.splice(index, 1)
  return { deleted: true, coinRefund: note.coins || 0 }
}

export function updateUserNoteTags(note, newActionIds) {
  if (!note || note.source === 'system') return false
  note.actionIds = [...newActionIds]
  return true
}
