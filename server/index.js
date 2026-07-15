const crypto = require('node:crypto')
const fs = require('node:fs/promises')
const http = require('node:http')
const path = require('node:path')
const { URL } = require('node:url')

const PORT = Number(process.env.SYNC_PORT || process.env.PORT || 4174)
const HOST = process.env.SYNC_HOST || '0.0.0.0'
const JWT_SECRET = process.env.SYNC_JWT_SECRET || 'dev-only-change-this-secret'
const TOKEN_TTL_SECONDS = Number(process.env.SYNC_TOKEN_TTL_SECONDS || 60 * 60 * 24 * 30)
const DB_FILE =
  process.env.SYNC_DB_FILE || path.join(__dirname, 'data', 'sync-db.json')

const CORS_ORIGIN = process.env.SYNC_CORS_ORIGIN || '*'

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'dev-only-change-this-secret') {
  throw new Error('SYNC_JWT_SECRET must be set in production.')
}

async function ensureDb() {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true })
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8')
    return JSON.parse(raw)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    const db = { users: [], saveSlots: [] }
    await writeDb(db)
    return db
  }
}

async function writeDb(db) {
  const tempFile = `${DB_FILE}.tmp`
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true })
  await fs.writeFile(tempFile, JSON.stringify(db, null, 2))
  await fs.rename(tempFile, DB_FILE)
}

function jsonResponse(res, status, body) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  })
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
      if (body.length > 10 * 1024 * 1024) {
        reject(new Error('Request body too large'))
        req.destroy()
      }
    })
    req.on('end', () => {
      if (!body) return resolve({})
      try {
        resolve(JSON.parse(body))
      } catch {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || '').split(':')
  if (!salt || !hash) return false
  const candidate = crypto.scryptSync(String(password), salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected)
}

function base64Url(input) {
  return Buffer.from(JSON.stringify(input)).toString('base64url')
}

function signToken(payload) {
  const header = base64Url({ alg: 'HS256', typ: 'JWT' })
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
  const body = base64Url({ ...payload, exp })
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url')
  return `${header}.${body}.${signature}`
}

function verifyToken(token) {
  const [header, body, signature] = String(token || '').split('.')
  if (!header || !body || !signature) return null
  const expected = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url')
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null
  }

  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
  return payload
}

async function getAuthedUser(req, db) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  const payload = verifyToken(token)
  if (!payload?.sub) return null
  return db.users.find(user => user.id === payload.sub) || null
}

function publicUser(user) {
  return { id: user.id, email: user.email, createdAt: user.createdAt }
}

async function handleAuth(req, res, db, pathname) {
  const body = await readBody(req)
  const email = normalizeEmail(body.email)
  const password = String(body.password || '')

  if (!email || !password) {
    return jsonResponse(res, 400, { error: 'Email and password are required.' })
  }

  if (pathname === '/auth/register') {
    if (password.length < 8) {
      return jsonResponse(res, 400, { error: 'Password must be at least 8 characters.' })
    }
    if (db.users.some(user => user.email === email)) {
      return jsonResponse(res, 409, { error: 'Email is already registered.' })
    }

    const user = {
      id: crypto.randomUUID(),
      email,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    }
    db.users.push(user)
    await writeDb(db)

    return jsonResponse(res, 201, {
      user: publicUser(user),
      token: signToken({ sub: user.id, email: user.email })
    })
  }

  const user = db.users.find(item => item.email === email)
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return jsonResponse(res, 401, { error: 'Invalid email or password.' })
  }

  return jsonResponse(res, 200, {
    user: publicUser(user),
    token: signToken({ sub: user.id, email: user.email })
  })
}

async function handleSlots(req, res, db, pathname) {
  const user = await getAuthedUser(req, db)
  if (!user) return jsonResponse(res, 401, { error: 'Unauthorized.' })

  if (req.method === 'GET' && pathname === '/sync/slots') {
    const slots = db.saveSlots
      .filter(slot => slot.userId === user.id && !slot.deletedAt)
      .sort((a, b) => String(b.serverUpdatedAt).localeCompare(String(a.serverUpdatedAt)))
    return jsonResponse(res, 200, { slots })
  }

  const match = pathname.match(/^\/sync\/slots\/([^/]+)$/)
  if (!match) return jsonResponse(res, 404, { error: 'Not found.' })

  const slotId = decodeURIComponent(match[1])
  const existing = db.saveSlots.find(slot => slot.userId === user.id && slot.slotId === slotId)

  if (req.method === 'PUT') {
    const body = await readBody(req)
    if (!body.saveData || typeof body.saveData !== 'object') {
      return jsonResponse(res, 400, { error: 'saveData is required.' })
    }

    const now = new Date().toISOString()
    const nextSlot = {
      userId: user.id,
      slotId,
      name: String(body.name || body.saveData.slotName || 'Untitled Save'),
      saveVersion: Number(body.saveData.version || 2),
      saveData: body.saveData,
      summary: body.summary || {},
      clientUpdatedAt: body.clientUpdatedAt || now,
      serverUpdatedAt: now,
      revision: existing ? existing.revision + 1 : 1,
      deletedAt: null,
      lastDeviceId: body.deviceId || null
    }

    if (existing) {
      Object.assign(existing, nextSlot)
    } else {
      db.saveSlots.push(nextSlot)
    }
    await writeDb(db)

    return jsonResponse(res, 200, { slot: nextSlot })
  }

  if (req.method === 'DELETE') {
    if (existing) {
      existing.deletedAt = new Date().toISOString()
      existing.serverUpdatedAt = existing.deletedAt
      existing.revision += 1
      await writeDb(db)
    }
    return jsonResponse(res, 200, { ok: true })
  }

  return jsonResponse(res, 405, { error: 'Method not allowed.' })
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return jsonResponse(res, 204, {})

    const db = await ensureDb()
    const url = new URL(req.url, `http://${req.headers.host}`)

    if (req.method === 'GET' && url.pathname === '/health') {
      return jsonResponse(res, 200, { ok: true })
    }

    if (
      req.method === 'POST' &&
      (url.pathname === '/auth/register' || url.pathname === '/auth/login')
    ) {
      return handleAuth(req, res, db, url.pathname)
    }

    if (url.pathname.startsWith('/sync/slots')) {
      return handleSlots(req, res, db, url.pathname)
    }

    return jsonResponse(res, 404, { error: 'Not found.' })
  } catch (error) {
    console.error(error)
    return jsonResponse(res, 500, { error: error.message || 'Internal server error.' })
  }
})

server.listen(PORT, HOST, () => {
  console.log(`Minerva sync server listening on http://${HOST}:${PORT}`)
})
