import { createRemoteJWKSet, jwtVerify } from 'jose'
import { ApiError } from './responses.mjs'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

export function normalizeTeamDomain(value) {
  const configured = String(value || '')
    .trim()
    .replace(/\/+$/, '')
  if (!configured) return ''
  const candidate = configured.includes('://') ? configured : `https://${configured}`
  try {
    const url = new URL(candidate)
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      return ''
    }
    return url.origin
  } catch {
    return ''
  }
}

function requireAccessConfig(env) {
  const teamDomain = normalizeTeamDomain(env.TEAM_DOMAIN)
  const audience = String(env.POLICY_AUD || '').trim()
  if (!teamDomain || !audience) {
    throw new ApiError(500, 'ACCESS_NOT_CONFIGURED', 'Cloudflare Access 尚未完成配置。', {
      recoverable: false,
    })
  }
  return { teamDomain, audience }
}

function developmentIdentity(request) {
  const url = new URL(request.url)
  if (!LOCAL_HOSTS.has(url.hostname)) {
    throw new ApiError(500, 'INSECURE_AUTH_MODE', '开发身份只允许在本机地址使用。', {
      recoverable: false,
    })
  }
  const subject = request.headers.get('X-Minerva-Dev-User')?.trim() || 'local-developer'
  const email = request.headers.get('X-Minerva-Dev-Email')?.trim() || 'local@minerva.invalid'
  return { subject: `dev:${subject}`, email, source: 'development' }
}

export async function authenticateRequest(request, env) {
  if (env.AUTH_MODE === 'development') return developmentIdentity(request)
  if (env.AUTH_MODE !== 'access') {
    throw new ApiError(500, 'AUTH_MODE_INVALID', '服务端身份验证模式无效。', {
      recoverable: false,
    })
  }

  const { teamDomain, audience } = requireAccessConfig(env)
  const token = request.headers.get('Cf-Access-Jwt-Assertion')
  if (!token) {
    throw new ApiError(401, 'AUTH_REQUIRED', '需要先通过 Cloudflare Access 登录。')
  }

  try {
    const jwks = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`))
    const { payload } = await jwtVerify(token, jwks, {
      issuer: teamDomain,
      audience,
    })
    if (typeof payload.sub !== 'string' || !payload.sub.trim()) {
      throw new Error('Access JWT is missing sub.')
    }
    return {
      subject: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : null,
      source: 'cloudflare-access',
    }
  } catch (cause) {
    throw new ApiError(401, 'AUTH_INVALID', 'Cloudflare Access 登录已失效，请重新登录。', {
      cause,
    })
  }
}
