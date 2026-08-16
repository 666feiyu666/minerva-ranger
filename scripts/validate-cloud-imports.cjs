const { readFileSync } = require('node:fs')
const { basename, resolve } = require('node:path')

function readArray(value, fieldName) {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new Error(`${fieldName} 必须是数组。`)
  return value
}

function validateCloudImport(document, sourceName = 'JSON') {
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw new Error(`${sourceName} 的顶层必须是对象。`)
  }
  if (document.formatVersion !== 2) {
    throw new Error(`${sourceName} 不是受支持的 V0.4 formatVersion 2 导出。`)
  }
  if (!document.identity || typeof document.identity !== 'object') {
    throw new Error(`${sourceName} 缺少 identity。`)
  }
  const identityName = String(document.identity.slotName || '').trim()
  if (!identityName) throw new Error(`${sourceName} 的身份名称为空。`)

  const rangerProfileId = String(document.ranger?.profileId || '').trim()
  if (!rangerProfileId) throw new Error(`${sourceName} 缺少 ranger.profileId。`)

  return {
    sourceName,
    identityName,
    rangerProfileId,
    skillCount: readArray(document.identity.skills, `${sourceName}.identity.skills`).length,
    actionCount: readArray(document.identity.actions, `${sourceName}.identity.actions`).length,
    noteCount: readArray(document.identity.notebook, `${sourceName}.identity.notebook`).length,
  }
}

function validateFiles(paths) {
  if (paths.length === 0) {
    throw new Error('请传入至少一个 V0.4 Desktop JSON 文件路径。')
  }
  const reports = paths.map((path) => {
    const absolutePath = resolve(path)
    const document = JSON.parse(readFileSync(absolutePath, 'utf8'))
    return validateCloudImport(document, basename(absolutePath))
  })
  const profileIds = new Set(reports.map((report) => report.rangerProfileId))
  return { reports, sharedRangerProfile: profileIds.size === 1 }
}

function main(argv = process.argv.slice(2)) {
  const result = validateFiles(argv)
  for (const report of result.reports) {
    process.stdout.write(
      `${report.sourceName}: ${report.identityName}; skills=${report.skillCount}; actions=${report.actionCount}; notes=${report.noteCount}\n`,
    )
  }
  process.stdout.write(
    result.sharedRangerProfile
      ? '巡林官档案一致：多身份合并时应去重。\n'
      : '巡林官档案不一致：导入时将按现有合并规则处理。\n',
  )
}

module.exports = { validateCloudImport, validateFiles }

if (require.main === module) {
  try {
    main()
  } catch (error) {
    process.stderr.write(`JSON 验证失败：${error.message}\n`)
    process.exitCode = 1
  }
}
