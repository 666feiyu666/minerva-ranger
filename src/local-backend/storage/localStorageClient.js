export function readText(key) {
  return localStorage.getItem(key)
}

export function writeText(key, value) {
  localStorage.setItem(key, value)
}

export function readJson(key) {
  const raw = readText(key)
  return raw ? JSON.parse(raw) : null
}

export function writeJson(key, value) {
  writeText(key, JSON.stringify(value))
}

export function removeItem(key) {
  localStorage.removeItem(key)
}
