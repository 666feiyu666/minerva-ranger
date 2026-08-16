import { authenticateRequest } from './auth.mjs'
import { errorResponse, jsonResponse, ApiError } from './responses.mjs'
import { commitUserSnapshot, readUserSnapshot } from './snapshotRepository.mjs'
import {
  readExpectedRevision,
  readIdempotencyKey,
  readSnapshotPayload,
  requireSameOrigin,
} from './validation.mjs'

async function shortSubjectHash(subject) {
  const bytes = new TextEncoder().encode(subject)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  let hex = ''
  for (const value of new Uint8Array(digest).subarray(0, 6)) {
    hex += value.toString(16).padStart(2, '0')
  }
  return hex
}

function requireMethod(request, allowed) {
  if (!allowed.includes(request.method)) {
    throw new ApiError(405, 'METHOD_NOT_ALLOWED', '该接口不支持此请求方法。')
  }
}

async function handleApi(request, env) {
  const url = new URL(request.url)
  if (url.pathname === '/api/health') {
    requireMethod(request, ['GET'])
    return jsonResponse({ ok: true, environment: env.ENVIRONMENT || 'unknown' })
  }

  const identity = await authenticateRequest(request, env)
  if (url.pathname === '/api/session') {
    requireMethod(request, ['GET'])
    return {
      response: jsonResponse({
        user: { email: identity.email, source: identity.source },
        environment: env.ENVIRONMENT || 'unknown',
      }),
      identity,
    }
  }

  if (url.pathname === '/api/snapshot' && request.method === 'GET') {
    const stored = await readUserSnapshot(env.DB, identity)
    return {
      response: jsonResponse({
        ...stored,
        user: { email: identity.email, source: identity.source },
      }),
      identity,
    }
  }

  if (url.pathname === '/api/snapshot' && request.method === 'PUT') {
    requireSameOrigin(request)
    const expectedRevision = readExpectedRevision(request)
    const idempotencyKey = readIdempotencyKey(request)
    const payload = await readSnapshotPayload(request, env)
    console.log({ event: 'snapshot_write_attempt', expectedRevision })
    const result = await commitUserSnapshot(env.DB, identity, {
      ...payload,
      expectedRevision,
      idempotencyKey,
    })
    return { response: jsonResponse(result), identity }
  }

  throw new ApiError(404, 'NOT_FOUND', '未找到该云端接口。')
}

export default {
  async fetch(request, env) {
    const requestId = request.headers.get('Cf-Ray') || crypto.randomUUID()
    const startedAt = Date.now()
    let identity = null
    let response
    try {
      const url = new URL(request.url)
      if (!url.pathname.startsWith('/api/')) {
        if (env.ASSETS?.fetch) return env.ASSETS.fetch(request)
        return new Response('Not found', { status: 404 })
      }
      const result = await handleApi(request, env)
      response = result instanceof Response ? result : result.response
      identity = result instanceof Response ? null : result.identity
      return response
    } catch (error) {
      response = errorResponse(error, requestId)
      if (!(error instanceof ApiError)) {
        console.error({ event: 'api_unhandled_error', requestId, error })
      }
      return response
    } finally {
      console.log({
        event: 'api_request',
        requestId,
        method: request.method,
        path: new URL(request.url).pathname,
        status: response?.status || 500,
        durationMs: Date.now() - startedAt,
        subjectHash: identity ? await shortSubjectHash(identity.subject) : null,
      })
    }
  },
}
