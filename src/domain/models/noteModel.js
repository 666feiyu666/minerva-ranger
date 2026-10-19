import { countVisibleNoteCharacters } from './noteContent'

export function toActionIds(actionIds) {
  if (Array.isArray(actionIds)) return [...new Set(actionIds.filter(Boolean))]
  if (actionIds) return [actionIds]
  return []
}

function inferActionNameSnapshot(note, normalizedType) {
  if (note.actionNameSnapshot) return note.actionNameSnapshot
  if (normalizedType !== 'planting') return null
  const prefix = ['[植树日志] ', '[种植日志] '].find((item) => note.title?.startsWith(item))
  return prefix ? note.title.slice(prefix.length).trim() || null : null
}

export function normalizeNote(note = {}) {
  const createdAt = note.createdAt || note.updatedAt || new Date().toISOString()
  const content = note.content || ''
  const inferredType =
    note.type ||
    (note.title?.startsWith('[种植日志]') || note.title?.startsWith('[植树日志]')
      ? 'planting'
      : 'essay')
  const normalizedType = inferredType === 'ranger' ? 'essay' : inferredType
  const source = note.source || (inferredType === 'system' ? 'system' : 'user')

  return {
    ...note,
    actionIds: toActionIds(note.actionIds || note.actionId),
    skillId: note.skillId || null,
    type: normalizedType,
    source,
    eventType: note.eventType || null,
    actionNameSnapshot: inferActionNameSnapshot(note, normalizedType),
    skillNameSnapshot: note.skillNameSnapshot || null,
    treeId: note.treeId || null,
    treeNameSnapshot: note.treeNameSnapshot || null,
    sessionId: note.sessionId || null,
    startedAt: note.startedAt || null,
    endedAt: note.endedAt || null,
    durationSeconds: Math.max(0, Number(note.durationSeconds) || 0),
    completedCycles: Math.max(0, Number(note.completedCycles) || 0),
    treesEarned: Math.max(0, Number(note.treesEarned) || 0),
    xpEarned: Math.max(0, Number(note.xpEarned) || 0),
    endReason: note.endReason || null,
    contentFormat: note.contentFormat || (normalizedType === 'essay' ? 'markdown' : 'plain'),
    content,
    wordCount:
      typeof note.wordCount === 'number'
        ? note.wordCount
        : countVisibleNoteCharacters(
            content,
            note.contentFormat || (normalizedType === 'essay' ? 'markdown' : 'plain'),
          ),
    coins: note.coins || 0,
    createdAt,
    updatedAt: note.updatedAt || createdAt,
    date: note.date || new Date(createdAt).toLocaleString(),
  }
}
