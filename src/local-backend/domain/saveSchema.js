import { getGlobalLevelFromXP } from './leveling'

const LEGACY_UNNAMED_IDENTITY = '\u672a\u547d\u540d\u8eab\u4efd\u6863\u6848'
const LEGACY_NUMBERED_IDENTITY_PATTERN = /^\u65b0\u8eab\u4efd\u6863\u6848 #(\d+)$/

const SAVE_ARRAY_FIELDS = [
  'unlockedTreeIds',
  'ownedBoostIds',
  'unlockedBackgroundIds',
  'skills',
  'actions',
  'notebook',
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

export function normalizeIdentityName(name) {
  if (typeof name !== 'string' || !name || name === LEGACY_UNNAMED_IDENTITY) {
    return '未命名身份'
  }
  const numberedMatch = name.match(LEGACY_NUMBERED_IDENTITY_PATTERN)
  return numberedMatch ? `新身份 #${numberedMatch[1]}` : name
}

export function normalizeSaveIndex(index = {}) {
  return {
    lastSelectedSlotId: index.lastSelectedSlotId || null,
    slots: Array.isArray(index.slots)
      ? index.slots.map((slot) => ({
          id: slot.id,
          name: normalizeIdentityName(slot.name),
          createdAt: slot.createdAt || new Date().toISOString(),
          updatedAt: slot.updatedAt || slot.createdAt || new Date().toISOString(),
          lastPlayedAt:
            slot.lastPlayedAt || slot.updatedAt || slot.createdAt || new Date().toISOString(),
          summary: {
            globalLevel: slot.summary?.globalLevel || 1,
            globalXP: slot.summary?.globalXP || 0,
            coins: slot.summary?.coins || 0,
            actionCount: slot.summary?.actionCount || 0,
            skillCount: slot.summary?.skillCount || 0,
            totalTrees: slot.summary?.totalTrees || 0,
            noteCount: slot.summary?.noteCount || 0,
          },
        }))
      : [],
  }
}

export function buildSaveSummary(saveData = {}) {
  const actionsList = Array.isArray(saveData.actions) ? saveData.actions : []
  const skillsList = Array.isArray(saveData.skills) ? saveData.skills : []
  const notebookList = Array.isArray(saveData.notebook) ? saveData.notebook : []

  return {
    globalLevel: getGlobalLevelFromXP(saveData.globalXP || 0),
    globalXP: saveData.globalXP || 0,
    coins: saveData.coins || 0,
    actionCount: actionsList.length,
    skillCount: skillsList.length,
    totalTrees: actionsList.reduce((sum, action) => sum + (action.totalTrees || 0), 0),
    noteCount: notebookList.length,
  }
}
