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
  localStorage.removeItem(key)
}
