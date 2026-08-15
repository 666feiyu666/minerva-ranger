const path = require('node:path')

const DEVELOPMENT_USER_DATA_SUFFIX = '-dev'

function resolveUserDataPath({ defaultUserDataPath, isPackaged, overridePath }) {
  if (typeof defaultUserDataPath !== 'string' || defaultUserDataPath.length === 0) {
    throw new TypeError('defaultUserDataPath 必须是非空字符串。')
  }

  if (typeof overridePath === 'string' && overridePath.trim().length > 0) {
    return path.resolve(overridePath)
  }

  if (isPackaged) return defaultUserDataPath

  return `${defaultUserDataPath}${DEVELOPMENT_USER_DATA_SUFFIX}`
}

module.exports = {
  DEVELOPMENT_USER_DATA_SUFFIX,
  resolveUserDataPath,
}
