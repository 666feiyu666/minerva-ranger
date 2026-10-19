const assert = require('node:assert/strict')
const path = require('node:path')
const { test } = require('node:test')
const {
  DEVELOPMENT_USER_DATA_SUFFIX,
  resolveUserDataPath,
} = require('../electron/userDataPath')

test('未打包 Electron 默认使用独立的开发数据目录', () => {
  const defaultUserDataPath = path.join('example', 'minerva-ranger')

  assert.equal(
    resolveUserDataPath({ defaultUserDataPath, isPackaged: false }),
    `${defaultUserDataPath}${DEVELOPMENT_USER_DATA_SUFFIX}`,
  )
})

test('打包 Electron 保持系统分配的正式数据目录', () => {
  const defaultUserDataPath = path.join('example', 'minerva-ranger')

  assert.equal(
    resolveUserDataPath({ defaultUserDataPath, isPackaged: true }),
    defaultUserDataPath,
  )
})

test('显式用户数据目录在开发态和打包态都具有最高优先级', () => {
  const defaultUserDataPath = path.join('example', 'minerva-ranger')
  const overridePath = path.join('example', 'isolated-user-data')
  const expectedPath = path.resolve(overridePath)

  assert.equal(
    resolveUserDataPath({ defaultUserDataPath, isPackaged: false, overridePath }),
    expectedPath,
  )
  assert.equal(
    resolveUserDataPath({ defaultUserDataPath, isPackaged: true, overridePath }),
    expectedPath,
  )
})
