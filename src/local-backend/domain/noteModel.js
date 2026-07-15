export function toProjectIds(projectIds) {
  if (Array.isArray(projectIds)) return [...new Set(projectIds.filter(Boolean))]
  if (projectIds) return [projectIds]
  return []
}

export function normalizeNote(note = {}) {
  const createdAt = note.createdAt || note.updatedAt || new Date().toISOString()
  const content = note.content || ''
  const inferredType = note.type || (note.title?.startsWith('[种植日志]') ? 'planting' : 'essay')
  const normalizedType = inferredType === 'ranger' ? 'essay' : inferredType
  const source = note.source || (inferredType === 'system' ? 'system' : 'user')

  return {
    ...note,
    projectIds: toProjectIds(note.projectIds || note.projectId),
    type: normalizedType,
    source,
    eventType: note.eventType || null,
    content,
    wordCount:
      typeof note.wordCount === 'number' ? note.wordCount : content.replace(/\s/g, '').length,
    coins: note.coins || 0,
    createdAt,
    updatedAt: note.updatedAt || createdAt,
    date: note.date || new Date(createdAt).toLocaleString()
  }
}
