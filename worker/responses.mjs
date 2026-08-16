export class ApiError extends Error {
  constructor(status, code, message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.recoverable = options.recoverable !== false
    this.details = options.details || null
  }
}

const API_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

export function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...API_HEADERS, ...extraHeaders },
  })
}

export function errorResponse(error, requestId) {
  const known = error instanceof ApiError
  const status = known ? error.status : 500
  const body = {
    error: {
      code: known ? error.code : 'INTERNAL_ERROR',
      message: known ? error.message : '云端服务暂时无法完成请求。',
      recoverable: known ? error.recoverable : true,
      requestId,
      ...(known && error.details ? { details: error.details } : {}),
    },
  }
  return jsonResponse(body, status)
}
