import { getGlobalLevelFromXP } from './leveling'

const SAVE_ARRAY_FIELDS = [
  'unlockedTreeIds',
  'ownedBoostIds',
  'unlockedBackgroundIds',
  'themes',
  'projects',
  'notebook'
]

export function validateSaveDataShape(saveData) {
  if (!saveData || typeof saveData !== 'object' || Array.isArray(saveData)) {
    return { ok: false, error: '存档根节点必须是一个对象。' }
  }

  for (const field of SAVE_ARRAY_FIELDS) {
    if (saveData[field] !== undefined && !Array.isArray(saveData[field])) {
      return { ok: false, error: `存档字段 ${field} 必须是数组。` }
    }
  }

  return { ok: true, error: null }
}

export function normalizeSaveIndex(index = {}) {
  return {
    version: 1,
    lastSelectedSlotId: index.lastSelectedSlotId || null,
    slots: Array.isArray(index.slots)
      ? index.slots.map(slot => ({
          id: slot.id,
          name: slot.name || '未命名身份档案',
          createdAt: slot.createdAt || new Date().toISOString(),
          updatedAt: slot.updatedAt || slot.createdAt || new Date().toISOString(),
          lastPlayedAt:
            slot.lastPlayedAt || slot.updatedAt || slot.createdAt || new Date().toISOString(),
          source: slot.source || 'local',
          summary: {
            globalLevel: slot.summary?.globalLevel || 1,
            globalXP: slot.summary?.globalXP || 0,
            coins: slot.summary?.coins || 0,
            projectCount: slot.summary?.projectCount || 0,
            themeCount: slot.summary?.themeCount || 0,
            totalTrees: slot.summary?.totalTrees || 0,
            noteCount: slot.summary?.noteCount || 0
          }
        }))
      : []
  }
}

export function buildSaveSummary(saveData = {}) {
  const projectsList = Array.isArray(saveData.projects) ? saveData.projects : []
  const themesList = Array.isArray(saveData.themes) ? saveData.themes : []
  const notebookList = Array.isArray(saveData.notebook) ? saveData.notebook : []

  return {
    globalLevel: getGlobalLevelFromXP(saveData.globalXP || 0),
    globalXP: saveData.globalXP || 0,
    coins: saveData.coins || 0,
    projectCount: projectsList.length,
    themeCount: themesList.length,
    totalTrees: projectsList.reduce((sum, project) => sum + (project.totalTrees || 0), 0),
    noteCount: notebookList.length
  }
}
