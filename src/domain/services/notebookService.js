import { normalizeNote, toActionIds } from '@/local-backend/domain/noteModel'
import { countVisibleNoteCharacters } from '@/local-backend/domain/noteContent'
import { isSameActionId } from '@/local-backend/domain/actionModel'

export function createNoteRecord({
  title,
  content,
  actionIds = [],
  skillId = null,
  type = 'planting',
  source = 'user',
  eventType = null,
  awardCoins = source === 'user',
  allowEmptyContent = false,
  id = Date.now(),
  now = new Date(),
  ...metadata
}) {
  const cleanTitle = String(title || '').trim()
  const contentFormat = metadata.contentFormat || (type === 'essay' ? 'markdown' : 'plain')
  const wordCount = countVisibleNoteCharacters(content, contentFormat)

  if (source === 'user' && !cleanTitle) {
    return {
      note: null,
      earnedCoins: 0,
      error: { title: '标题无效', message: '标题不能为空。' },
    }
  }

  if (source === 'user' && wordCount <= 0 && !allowEmptyContent) {
    return {
      note: null,
      earnedCoins: 0,
      error: {
        title: '内容无效',
        message: type === 'planting' ? '未记录笔记，未能获得金币！' : '内容不能为空',
      },
    }
  }

  const earnedCoins = awardCoins && wordCount > 0 ? 10 : 0
  const createdAt = now.toISOString()
  const note = normalizeNote({
    id,
    title: cleanTitle || title,
    content,
    type,
    source,
    eventType,
    actionIds,
    skillId,
    wordCount,
    contentFormat,
    coins: earnedCoins,
    createdAt,
    updatedAt: createdAt,
    date: now.toLocaleString(),
    ...metadata,
  })

  return { note, earnedCoins, error: null }
}

export function renameUserNote(note, newTitle, now = new Date()) {
  const cleanTitle = String(newTitle || '').trim()
  if (!note || note.source === 'system' || !cleanTitle) return false
  note.title = cleanTitle
  note.updatedAt = now.toISOString()
  note.date = now.toLocaleString()
  return true
}

export function updateUserNote(note, payload = {}, now = new Date()) {
  if (!note || note.source === 'system') return { ok: false }

  if (typeof payload.title === 'string' && !payload.title.trim()) {
    return {
      ok: false,
      error: { title: '标题无效', message: '标题不能为空。' },
    }
  }

  if (typeof payload.content === 'string') {
    const contentFormat = payload.contentFormat || note.contentFormat || 'plain'
    const wordCount = countVisibleNoteCharacters(payload.content, contentFormat)
    if (wordCount <= 0 && note.type !== 'planting') {
      return {
        ok: false,
        error: {
          title: '内容无效',
          message: '日志内容不能为空',
        },
      }
    }
    note.content = payload.content
    note.wordCount = wordCount
    note.contentFormat = contentFormat
  }

  if (typeof payload.title === 'string' && payload.title.trim()) {
    note.title = payload.title.trim()
  }

  if (payload.actionIds !== undefined) {
    note.actionIds = toActionIds(payload.actionIds)
  }

  if (payload.skillId !== undefined) note.skillId = payload.skillId || null
  if (payload.actionNameSnapshot !== undefined) {
    note.actionNameSnapshot = payload.actionNameSnapshot || null
  }
  if (payload.skillNameSnapshot !== undefined) {
    note.skillNameSnapshot = payload.skillNameSnapshot || null
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

export function migrateNotesForDeletedAction(
  notebook,
  action,
  { skillName = null } = {},
) {
  if (!action) return (notebook || []).map(normalizeNote)

  return (notebook || []).map((note) => {
    const normalized = normalizeNote(note)
    if (!normalized.actionIds.some((actionId) => isSameActionId(actionId, action.id))) {
      return normalized
    }

    return normalizeNote({
      ...normalized,
      actionIds: normalized.actionIds.filter(
        (actionId) => !isSameActionId(actionId, action.id),
      ),
      skillId: action.skillId || normalized.skillId || null,
      actionNameSnapshot: action.name || normalized.actionNameSnapshot,
      skillNameSnapshot: skillName || normalized.skillNameSnapshot,
    })
  })
}

export function syncNotesForActionOwnership(
  notebook,
  action,
  { skillName = null } = {},
) {
  if (!action) return (notebook || []).map(normalizeNote)

  return (notebook || []).map((note) => {
    const normalized = normalizeNote(note)
    if (!normalized.actionIds.some((actionId) => isSameActionId(actionId, action.id))) {
      return normalized
    }

    return normalizeNote({
      ...normalized,
      skillId: action.skillId || null,
      actionNameSnapshot: action.name || normalized.actionNameSnapshot,
      skillNameSnapshot: skillName || normalized.skillNameSnapshot,
    })
  })
}

export function migrateNotesForDeletedSkill(notebook, skill) {
  if (!skill) return (notebook || []).map(normalizeNote)

  return (notebook || []).map((note) => {
    const normalized = normalizeNote(note)
    if (String(normalized.skillId) !== String(skill.id)) return normalized

    return normalizeNote({
      ...normalized,
      skillId: null,
      skillNameSnapshot: skill.name || normalized.skillNameSnapshot,
    })
  })
}
