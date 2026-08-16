import { applyD1Migrations, env, SELF } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'

const emptySnapshot = () => ({
  defaultIdentityBootstrapped: false,
  saveIndex: { lastSelectedSlotId: null, slots: [] },
  rangerProfile: null,
  slots: [],
})

function writeRequest(snapshot, options = {}) {
  const revision = options.revision ?? 0
  const key = options.key || crypto.randomUUID()
  const origin = options.origin === undefined ? 'http://localhost' : options.origin
  const headers = {
    'Content-Type': 'application/json',
    'Idempotency-Key': key,
    'If-Match': String(revision),
    ...(origin ? { Origin: origin } : {}),
    ...(options.user ? { 'X-Minerva-Dev-User': options.user } : {}),
  }
  return SELF.fetch('http://localhost/api/snapshot', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ schemaVersion: 1, snapshot }),
  })
}

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
  await env.DB.batch([
    env.DB.prepare('DELETE FROM cloud_snapshots'),
    env.DB.prepare('DELETE FROM cloud_users'),
  ])
})

describe('Cloud D1 snapshot API', () => {
  it('reports health without exposing storage details', async () => {
    const response = await SELF.fetch('http://localhost/api/health')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, environment: 'local' })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('creates and reloads one revisioned snapshot for the Access subject', async () => {
    const initial = await SELF.fetch('http://localhost/api/snapshot')
    expect(initial.status).toBe(200)
    expect(await initial.json()).toMatchObject({ revision: 0, snapshot: null })

    const snapshot = emptySnapshot()
    snapshot.rangerProfile = { globalLevel: 3 }
    const written = await writeRequest(snapshot)
    expect(written.status).toBe(200)
    expect(await written.json()).toMatchObject({ revision: 1, idempotent: false })

    const loaded = await SELF.fetch('http://localhost/api/snapshot')
    expect(await loaded.json()).toMatchObject({ revision: 1, snapshot })
  })

  it('returns the same revision when an idempotency key is retried', async () => {
    const key = crypto.randomUUID()
    const first = await writeRequest(emptySnapshot(), { key })
    expect((await first.json()).revision).toBe(1)

    const retried = await writeRequest(emptySnapshot(), { key, revision: 0 })
    expect(retried.status).toBe(200)
    expect(await retried.json()).toMatchObject({ revision: 1, idempotent: true })
  })

  it('advances an existing snapshot when the expected revision matches', async () => {
    expect((await writeRequest(emptySnapshot())).status).toBe(200)
    const updated = emptySnapshot()
    updated.rangerProfile = { marker: 'second revision' }

    const response = await writeRequest(updated, { revision: 1 })
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ revision: 2, idempotent: false })
  })

  it('rejects stale revisions without overwriting the committed snapshot', async () => {
    const committed = emptySnapshot()
    committed.rangerProfile = { marker: 'first' }
    expect((await writeRequest(committed)).status).toBe(200)

    const stale = emptySnapshot()
    stale.rangerProfile = { marker: 'stale' }
    const response = await writeRequest(stale, { revision: 0 })
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({
      error: { code: 'STALE_REVISION', details: { currentRevision: 1 } },
    })

    const loaded = await SELF.fetch('http://localhost/api/snapshot')
    expect((await loaded.json()).snapshot.rangerProfile.marker).toBe('first')
  })

  it('isolates snapshots by authenticated subject', async () => {
    const snapshot = emptySnapshot()
    snapshot.rangerProfile = { owner: 'alice' }
    expect((await writeRequest(snapshot, { user: 'alice' })).status).toBe(200)

    const bob = await SELF.fetch('http://localhost/api/snapshot', {
      headers: { 'X-Minerva-Dev-User': 'bob' },
    })
    expect(await bob.json()).toMatchObject({ revision: 0, snapshot: null })
  })

  it('rejects missing same-origin evidence and oversized snapshots', async () => {
    const noOrigin = await writeRequest(emptySnapshot(), { origin: null })
    expect(noOrigin.status).toBe(403)
    expect(await noOrigin.json()).toMatchObject({ error: { code: 'ORIGIN_REJECTED' } })

    const oversized = emptySnapshot()
    oversized.rangerProfile = { content: 'x'.repeat(1_500_001) }
    const tooLarge = await writeRequest(oversized)
    expect(tooLarge.status).toBe(413)
    expect(await tooLarge.json()).toMatchObject({ error: { code: 'PAYLOAD_TOO_LARGE' } })
  })
})
