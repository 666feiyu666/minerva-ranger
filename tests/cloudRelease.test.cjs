const test = require('node:test')
const assert = require('node:assert/strict')

const {
  TARGETS,
  createReleasePlan,
  timestampForPath,
  verifyAccessProtection,
} = require('../scripts/cloud-release.cjs')
const { validateCloudImport } = require('../scripts/validate-cloud-imports.cjs')

test('Development 与 Production 使用不同的 D1 数据库', () => {
  assert.notEqual(TARGETS.development.databaseName, TARGETS.production.databaseName)
})

test('正式发布必须显式确认', () => {
  assert.throws(() => createReleasePlan('production'), /--confirm-production/)
})

test('发布计划在迁移与部署前导出目标 D1 备份', () => {
  const plan = createReleasePlan('production', {
    confirmProduction: true,
    now: new Date('2026-08-16T12:34:56.000Z'),
  })
  const names = plan.steps.map((step) => step.name)
  const backupIndex = names.indexOf('export remote D1 backup')
  const migrationIndex = names.indexOf('apply D1 migrations')
  const deployIndex = names.indexOf('deploy production')

  assert.ok(backupIndex > -1)
  assert.ok(backupIndex < migrationIndex)
  assert.ok(backupIndex < deployIndex)
  assert.match(plan.backupPath, /\.cloudflare-backups[\\/]production/)
})

test('Development 发布命令不会引用 Production 数据库', () => {
  const plan = createReleasePlan('development')
  const rendered = JSON.stringify(plan.steps)
  assert.match(rendered, /minerva-ranger-cloud-development/)
  assert.doesNotMatch(rendered, /minerva-ranger-cloud-preview/)
})

test('备份时间戳可用于跨平台文件名', () => {
  assert.equal(timestampForPath(new Date('2026-08-16T12:34:56.789Z')), '2026-08-16_12-34-56-789')
})

test('Access 冒烟检查会容忍刚部署时的短暂 404', async () => {
  const statuses = [404, 302]
  let calls = 0
  await verifyAccessProtection('https://development.example.com', {
    attempts: 2,
    delayMs: 0,
    wait: async () => undefined,
    fetchImpl: async () => {
      const status = statuses[calls]
      calls += 1
      return {
        status,
        headers: { get: (name) => (name === 'location' && status === 302 ? '/login' : null) },
      }
    },
  })
  assert.equal(calls, 2)
})

test('V0.4 Desktop JSON 校验只接受 formatVersion 2 与完整身份/巡林官', () => {
  const report = validateCloudImport({
    formatVersion: 2,
    identity: {
      slotName: '测试身份',
      skills: [{}],
      actions: [{}, {}],
      notebook: [],
    },
    ranger: { profileId: 'ranger-1' },
  })
  assert.deepEqual(
    {
      identityName: report.identityName,
      rangerProfileId: report.rangerProfileId,
      skillCount: report.skillCount,
      actionCount: report.actionCount,
      noteCount: report.noteCount,
    },
    {
      identityName: '测试身份',
      rangerProfileId: 'ranger-1',
      skillCount: 1,
      actionCount: 2,
      noteCount: 0,
    },
  )
})
