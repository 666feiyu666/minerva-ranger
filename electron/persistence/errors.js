class PersistenceError extends Error {
  constructor(code, message, details = null, options = {}) {
    super(message, options)
    this.name = 'PersistenceError'
    this.code = code
    this.details = details
    this.recoverable = options.recoverable ?? true
  }
}

function toPersistenceError(error, fallbackCode = 'PERSISTENCE_FAILED') {
  if (error instanceof PersistenceError) return error

  const message = error?.message || String(error)
  let code = fallbackCode
  if (/SQLITE_(FULL|IOERR|CANTOPEN|READONLY)/i.test(message)) code = 'STORAGE_UNAVAILABLE'
  if (
    /SQLITE_(CORRUPT|NOTADB)|file is not a database|database disk image is malformed/i.test(
      message,
    )
  ) {
    code = 'DATABASE_CORRUPT'
  }

  return new PersistenceError(code, message, null, {
    cause: error,
    recoverable: code !== 'DATABASE_CORRUPT',
  })
}

function serializePersistenceError(error) {
  const normalized = toPersistenceError(error)
  return {
    code: normalized.code,
    message: normalized.message,
    details: normalized.details,
    recoverable: normalized.recoverable,
  }
}

module.exports = {
  PersistenceError,
  serializePersistenceError,
  toPersistenceError,
}
