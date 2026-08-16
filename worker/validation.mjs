import { ApiError } from './responses.mjs'

export const DEFAULT_MAX_SNAPSHOT_BYTES = 1_500_000
const MAX_SLOT_COUNT = 1000
const MAX_REQUEST_OVERHEAD_BYTES = 32_768

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function assertPlainObject(value, label) {
  if (!isPlainObject(value)) {
    throw new ApiError(400, 'INVALID_PAYLOAD', `${label}必须是对象。`)
  }
}

function maxSnapshotBytes(env) {
  const configured = Number(env.MAX_SNAPSHOT_BYTES)
  return Number.isInteger(configured) && configured >= 65_536
    ? configured
    : DEFAULT_MAX_SNAPSHOT_BYTES
}

function utf8Bytes(value) {
  return new TextEncoder().encode(value).byteLength
}

export function requireSameOrigin(request) {
  const origin = request.headers.get('Origin')
  const expectedOrigin = new URL(request.url).origin
  if (!origin || origin !== expectedOrigin) {
    throw new ApiError(403, 'ORIGIN_REJECTED', '只接受来自当前应用页面的写入请求。')
  }
  const fetchSite = request.headers.get('Sec-Fetch-Site')
  if (fetchSite && fetchSite !== 'same-origin') {
    throw new ApiError(403, 'ORIGIN_REJECTED', '跨站写入请求已被拒绝。')
  }
}

export function readExpectedRevision(request) {
  const raw = request.headers.get('If-Match')?.trim()
  const normalized = raw?.replace(/^W\//, '').replace(/^"|"$/g, '')
  if (!normalized || !/^\d+$/.test(normalized)) {
    throw new ApiError(428, 'REVISION_REQUIRED', '写入请求必须提供有效的 If-Match 修订号。')
  }
  const revision = Number(normalized)
  if (!Number.isSafeInteger(revision)) {
    throw new ApiError(400, 'REVISION_INVALID', '修订号超出有效范围。')
  }
  return revision
}

export function readIdempotencyKey(request) {
  const value = request.headers.get('Idempotency-Key')?.trim()
  if (!value || value.length < 8 || value.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(value)) {
    throw new ApiError(400, 'IDEMPOTENCY_KEY_INVALID', '写入请求缺少有效的幂等键。')
  }
  return value
}

export async function readSnapshotPayload(request, env) {
  const limit = maxSnapshotBytes(env)
  const contentLength = Number(request.headers.get('Content-Length'))
  if (Number.isFinite(contentLength) && contentLength > limit + MAX_REQUEST_OVERHEAD_BYTES) {
    throw new ApiError(413, 'PAYLOAD_TOO_LARGE', '云端存档超过 1.5 MB 限制。', {
      recoverable: false,
    })
  }

  let body
  try {
    body = await request.json()
  } catch (cause) {
    throw new ApiError(400, 'INVALID_JSON', '请求正文不是有效 JSON。', { cause })
  }
  assertPlainObject(body, '请求正文')
  if (body.schemaVersion !== 1) {
    throw new ApiError(400, 'SCHEMA_VERSION_UNSUPPORTED', '不支持该云端快照版本。', {
      recoverable: false,
    })
  }

  const snapshot = body.snapshot
  assertPlainObject(snapshot, '云端快照')
  const saveIndex = snapshot.saveIndex
  assertPlainObject(saveIndex, '存档索引')
  if (!Array.isArray(saveIndex.slots) || saveIndex.slots.length > MAX_SLOT_COUNT) {
    throw new ApiError(400, 'INVALID_PAYLOAD', '存档索引包含无效的身份列表。')
  }
  if (!Array.isArray(snapshot.slots) || snapshot.slots.length !== saveIndex.slots.length) {
    throw new ApiError(400, 'INVALID_PAYLOAD', '身份索引与身份数据数量不一致。')
  }
  if (snapshot.rangerProfile !== null && snapshot.rangerProfile !== undefined) {
    assertPlainObject(snapshot.rangerProfile, '巡林官档案')
  }

  const indexIds = new Set()
  for (const metadata of saveIndex.slots) {
    assertPlainObject(metadata, '身份索引项')
    if (typeof metadata.id !== 'string' || !metadata.id.trim() || metadata.id.length > 200) {
      throw new ApiError(400, 'INVALID_PAYLOAD', '身份索引项缺少有效 ID。')
    }
    if (indexIds.has(metadata.id)) {
      throw new ApiError(400, 'INVALID_PAYLOAD', `身份索引包含重复 ID：${metadata.id}`)
    }
    indexIds.add(metadata.id)
  }

  const dataIds = new Set()
  for (const entry of snapshot.slots) {
    assertPlainObject(entry, '身份数据项')
    if (typeof entry.id !== 'string' || !indexIds.has(entry.id) || dataIds.has(entry.id)) {
      throw new ApiError(400, 'INVALID_PAYLOAD', '身份数据 ID 与索引不一致。')
    }
    assertPlainObject(entry.payload, `身份 ${entry.id} 的快照`)
    if (entry.payload.slotId && entry.payload.slotId !== entry.id) {
      throw new ApiError(400, 'INVALID_PAYLOAD', `身份 ${entry.id} 的快照 ID 不匹配。`)
    }
    dataIds.add(entry.id)
  }

  const serialized = JSON.stringify(snapshot)
  const payloadBytes = utf8Bytes(serialized)
  if (payloadBytes > limit) {
    throw new ApiError(413, 'PAYLOAD_TOO_LARGE', '云端存档超过 1.5 MB 限制。', {
      recoverable: false,
      details: { limitBytes: limit, payloadBytes },
    })
  }
  return { snapshot, serialized, payloadBytes, schemaVersion: body.schemaVersion }
}
