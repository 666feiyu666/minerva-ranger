const { PersistenceError } = require('./errors')

const MAX_SLOT_COUNT = 1000
const MAX_JSON_BYTES = 16 * 1024 * 1024

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function assertPlainObject(value, label) {
  if (!isPlainObject(value)) {
    throw new PersistenceError('INVALID_PAYLOAD', `${label}必须是对象。`)
  }
}

function assertJsonSize(value, label) {
  const serialized = JSON.stringify(value)
  if (Buffer.byteLength(serialized, 'utf8') > MAX_JSON_BYTES) {
    throw new PersistenceError('PAYLOAD_TOO_LARGE', `${label}超过 16 MiB 限制。`)
  }
  return serialized
}

function normalizeSlotMetadata(slot) {
  assertPlainObject(slot, '身份索引项')
  if (typeof slot.id !== 'string' || !slot.id.trim()) {
    throw new PersistenceError('INVALID_PAYLOAD', '身份索引项缺少有效 ID。')
  }
  return {
    ...slot,
    id: slot.id,
    name: typeof slot.name === 'string' && slot.name.trim() ? slot.name : '未命名身份',
  }
}

function normalizePersistenceSnapshot(snapshot) {
  assertPlainObject(snapshot, '持久化快照')

  const saveIndex = snapshot.saveIndex ?? { lastSelectedSlotId: null, slots: [] }
  assertPlainObject(saveIndex, '存档索引')
  if (!Array.isArray(saveIndex.slots)) {
    throw new PersistenceError('INVALID_PAYLOAD', '存档索引的 slots 必须是数组。')
  }
  if (saveIndex.slots.length > MAX_SLOT_COUNT) {
    throw new PersistenceError('PAYLOAD_TOO_LARGE', `身份数量不能超过 ${MAX_SLOT_COUNT}。`)
  }

  const normalizedIndex = {
    ...saveIndex,
    lastSelectedSlotId:
      typeof saveIndex.lastSelectedSlotId === 'string' ? saveIndex.lastSelectedSlotId : null,
    slots: saveIndex.slots.map(normalizeSlotMetadata),
  }
  const indexIds = new Set()
  for (const slot of normalizedIndex.slots) {
    if (indexIds.has(slot.id)) {
      throw new PersistenceError('INVALID_PAYLOAD', `身份索引包含重复 ID：${slot.id}`)
    }
    indexIds.add(slot.id)
  }

  const slots = Array.isArray(snapshot.slots) ? snapshot.slots : []
  if (slots.length !== normalizedIndex.slots.length) {
    throw new PersistenceError('INVALID_PAYLOAD', '身份索引与身份数据数量不一致。')
  }

  const normalizedSlots = slots.map((entry) => {
    assertPlainObject(entry, '身份数据项')
    if (typeof entry.id !== 'string' || !indexIds.has(entry.id)) {
      throw new PersistenceError('INVALID_PAYLOAD', `身份数据 ID 不在索引中：${entry.id || '空'}`)
    }
    assertPlainObject(entry.payload, `身份 ${entry.id} 的快照`)
    if (entry.payload.slotId && entry.payload.slotId !== entry.id) {
      throw new PersistenceError('INVALID_PAYLOAD', `身份 ${entry.id} 的快照 ID 不匹配。`)
    }
    return { id: entry.id, payload: { ...entry.payload, slotId: entry.id } }
  })

  const dataIds = new Set(normalizedSlots.map((entry) => entry.id))
  for (const slotId of indexIds) {
    if (!dataIds.has(slotId)) {
      throw new PersistenceError('INVALID_PAYLOAD', `身份 ${slotId} 缺少快照数据。`)
    }
  }

  const rangerProfile = snapshot.rangerProfile ?? null
  if (rangerProfile !== null) assertPlainObject(rangerProfile, '巡林官档案')

  assertJsonSize(normalizedIndex, '存档索引')
  if (rangerProfile) assertJsonSize(rangerProfile, '巡林官档案')
  for (const slot of normalizedSlots) assertJsonSize(slot.payload, `身份 ${slot.id}`)

  return {
    saveIndex: normalizedIndex,
    rangerProfile,
    slots: normalizedSlots,
    defaultIdentityBootstrapped: Boolean(snapshot.defaultIdentityBootstrapped),
  }
}

module.exports = {
  MAX_JSON_BYTES,
  MAX_SLOT_COUNT,
  isPlainObject,
  normalizePersistenceSnapshot,
}
