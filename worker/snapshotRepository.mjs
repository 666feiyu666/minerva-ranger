import { ApiError } from './responses.mjs'

function parseSnapshot(row) {
  if (!row) return null
  try {
    return JSON.parse(row.payload_json)
  } catch (cause) {
    throw new ApiError(500, 'SNAPSHOT_CORRUPTED', '云端快照无法读取，请联系管理员。', {
      cause,
      recoverable: false,
    })
  }
}

async function readRow(db, subject) {
  return db
    .prepare(
      `SELECT revision, schema_version, payload_json, payload_bytes,
              last_request_id, created_at, updated_at
         FROM cloud_snapshots
        WHERE subject = ?1`,
    )
    .bind(subject)
    .first()
}

export async function readUserSnapshot(db, identity) {
  const now = new Date().toISOString()
  await db
    .prepare(
      `INSERT INTO cloud_users (subject, email, created_at, last_seen_at)
       VALUES (?1, ?2, ?3, ?3)
       ON CONFLICT(subject) DO UPDATE SET
         email = excluded.email,
         last_seen_at = excluded.last_seen_at`,
    )
    .bind(identity.subject, identity.email, now)
    .run()

  const row = await readRow(db, identity.subject)
  return {
    revision: Number(row?.revision) || 0,
    schemaVersion: Number(row?.schema_version) || 1,
    snapshot: parseSnapshot(row),
    updatedAt: row?.updated_at || null,
  }
}

export async function commitUserSnapshot(
  db,
  identity,
  { expectedRevision, idempotencyKey, schemaVersion, serialized, payloadBytes },
) {
  const current = await readRow(db, identity.subject)
  if (current?.last_request_id === idempotencyKey) {
    return {
      revision: Number(current.revision),
      updatedAt: current.updated_at,
      idempotent: true,
    }
  }

  const currentRevision = Number(current?.revision) || 0
  if (currentRevision !== expectedRevision) {
    throw new ApiError(409, 'STALE_REVISION', '云端存档已被另一个窗口更新。', {
      details: { expectedRevision, currentRevision, updatedAt: current?.updated_at || null },
    })
  }

  const now = new Date().toISOString()
  await db
    .prepare(
      `INSERT INTO cloud_users (subject, email, created_at, last_seen_at)
       VALUES (?1, ?2, ?3, ?3)
       ON CONFLICT(subject) DO UPDATE SET
         email = excluded.email,
         last_seen_at = excluded.last_seen_at`,
    )
    .bind(identity.subject, identity.email, now)
    .run()

  let written = null
  let writeError = null
  try {
    written = current
      ? await db
          .prepare(
            `UPDATE cloud_snapshots
                SET revision = revision + 1,
                    schema_version = ?2,
                    payload_json = ?3,
                    payload_bytes = ?4,
                    last_request_id = ?5,
                    updated_at = ?6
              WHERE subject = ?1 AND revision = ?7
              RETURNING revision, updated_at`,
          )
          .bind(
            identity.subject,
            schemaVersion,
            serialized,
            payloadBytes,
            idempotencyKey,
            now,
            expectedRevision,
          )
          .first()
      : await db
          .prepare(
            `INSERT INTO cloud_snapshots (
               subject, revision, schema_version, payload_json, payload_bytes,
               last_request_id, created_at, updated_at
             )
             VALUES (?1, 1, ?2, ?3, ?4, ?5, ?6, ?6)
             RETURNING revision, updated_at`,
          )
          .bind(identity.subject, schemaVersion, serialized, payloadBytes, idempotencyKey, now)
          .first()
  } catch (error) {
    // A concurrent first write can win after the pre-read. Re-read below to
    // distinguish that expected race from an actual database failure.
    writeError = error
  }

  if (written) {
    return { revision: Number(written.revision), updatedAt: written.updated_at, idempotent: false }
  }

  const latest = await readRow(db, identity.subject)
  if (latest?.last_request_id === idempotencyKey) {
    return {
      revision: Number(latest.revision),
      updatedAt: latest.updated_at,
      idempotent: true,
    }
  }
  if (!latest && writeError) throw writeError
  throw new ApiError(409, 'STALE_REVISION', '云端存档已被另一个窗口更新。', {
    details: {
      currentRevision: Number(latest?.revision) || 0,
      expectedRevision,
      updatedAt: latest?.updated_at || null,
    },
  })
}
