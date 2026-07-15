const DEFAULT_DEV_API_URL = 'http://localhost:4174'
const API_URL = (
  import.meta.env.VITE_SYNC_API_URL ||
  (import.meta.env.DEV ? DEFAULT_DEV_API_URL : '')
).replace(/\/+$/, '')
const SESSION_KEY = 'minerva_self_hosted_sync_session_v1'

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveStoredSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY)
}

async function request(path, options = {}) {
  if (!API_URL) throw new Error('VITE_SYNC_API_URL is not configured.')

  const session = getStoredSession()
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options.headers || {})
    }
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`)
  }
  return data
}

async function authenticate(path, email, password) {
  const session = await request(path, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
  saveStoredSession(session)
  return session
}

export function login(email, password) {
  return authenticate('/auth/login', email, password)
}

export function register(email, password) {
  return authenticate('/auth/register', email, password)
}

export async function listSlots() {
  const data = await request('/sync/slots')
  return data.slots || []
}

export function upsertSlot(slotId, payload) {
  return request(`/sync/slots/${encodeURIComponent(slotId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export function deleteSlot(slotId) {
  return request(`/sync/slots/${encodeURIComponent(slotId)}`, {
    method: 'DELETE'
  })
}
