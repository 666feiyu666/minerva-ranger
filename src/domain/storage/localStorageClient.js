let storageOverride = null

function getStorage() {
  if (storageOverride) return storageOverride
  if (typeof localStorage === 'undefined') {
    throw new Error('当前环境不提供本地存储。')
  }
  return localStorage
}

export function configureStorageClient(storage = null) {
  storageOverride = storage
}

export function readText(key) {
  return getStorage().getItem(key)
}

export function writeText(key, value) {
  getStorage().setItem(key, value)
}

export function readJson(key) {
  const raw = readText(key)
  return raw ? JSON.parse(raw) : null
}

export function writeJson(key, value) {
  writeText(key, JSON.stringify(value))
}

export function readJsonWithBackup(key, backupKey) {
  try {
    return readJson(key)
  } catch (primaryError) {
    const backupRaw = readText(backupKey)
    if (!backupRaw) throw primaryError

    const backupValue = JSON.parse(backupRaw)

    // Repair the primary copy after a successful recovery. Failure to repair
    // must not hide the valid backup from the caller.
    try {
      writeText(key, backupRaw)
    } catch (repairError) {
      console.error('Failed to repair localStorage data from backup.', repairError)
    }

    return backupValue
  }
}

export function writeJsonWithBackup(key, backupKey, value) {
  const serialized = JSON.stringify(value)
  const previousValue = readText(key)

  if (previousValue !== null) writeText(backupKey, previousValue)
  writeText(key, serialized)
}

export function removeItem(key) {
  getStorage().removeItem(key)
}

export function listStorageKeys() {
  const storage = getStorage()
  return Array.from({ length: storage.length }, (_value, index) => storage.key(index)).filter(
    Boolean,
  )
}
