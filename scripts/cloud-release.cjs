const { mkdirSync } = require('node:fs')
const { dirname, join, resolve } = require('node:path')
const { spawnSync } = require('node:child_process')

const ROOT = resolve(__dirname, '..')
const RELEASE_LOG_PATH = join(ROOT, '.wrangler', 'logs', 'cloud-release.log')
const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npxExecutable = process.platform === 'win32' ? 'npx.cmd' : 'npx'

const TARGETS = Object.freeze({
  development: Object.freeze({
    cloudflareEnvironment: 'development',
    databaseName: 'minerva-ranger-cloud-development',
    url: 'https://minerva-ranger-cloud-development.feiyut666.workers.dev',
  }),
  production: Object.freeze({
    cloudflareEnvironment: 'production',
    databaseName: 'minerva-ranger-cloud-preview',
    url: 'https://minerva-ranger-cloud-preview.feiyut666.workers.dev',
  }),
})

function timestampForPath(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
}

function createReleasePlan(targetName, options = {}) {
  const target = TARGETS[targetName]
  if (!target) {
    throw new Error(`未知 Cloud 目标环境：${targetName || '（未提供）'}`)
  }
  if (targetName === 'production' && options.confirmProduction !== true) {
    throw new Error('正式环境发布必须显式提供 --confirm-production。')
  }

  const backupPath = join(
    ROOT,
    '.cloudflare-backups',
    targetName,
    `${timestampForPath(options.now)}.sql`,
  )
  const databaseArguments = [target.databaseName, '--env', target.cloudflareEnvironment, '--remote']

  return {
    targetName,
    target,
    backupPath,
    steps: [
      { name: 'V0.4 regression tests', command: npmExecutable, args: ['test'] },
      { name: 'lint checks', command: npmExecutable, args: ['run', 'check'] },
      { name: 'Workers and D1 checks', command: npmExecutable, args: ['run', 'check:cloud'] },
      {
        name: `build ${targetName}`,
        command: npmExecutable,
        args: ['run', `build:cloud:${targetName}`],
      },
      {
        name: 'deployment dry run',
        command: npxExecutable,
        args: ['wrangler', 'deploy', '--dry-run'],
      },
      {
        name: 'export remote D1 backup',
        command: npxExecutable,
        args: ['wrangler', 'd1', 'export', ...databaseArguments, '--output', backupPath],
      },
      {
        name: 'list pending D1 migrations',
        command: npxExecutable,
        args: ['wrangler', 'd1', 'migrations', 'list', ...databaseArguments],
      },
      {
        name: 'apply D1 migrations',
        command: npxExecutable,
        args: ['wrangler', 'd1', 'migrations', 'apply', ...databaseArguments],
      },
      { name: `deploy ${targetName}`, command: npxExecutable, args: ['wrangler', 'deploy'] },
    ],
  }
}

function runStep(step) {
  process.stdout.write(`\n==> ${step.name}\n`)
  const usesWindowsCommandShim = process.platform === 'win32' && /\.(cmd|bat)$/i.test(step.command)
  const command = usesWindowsCommandShim ? process.env.ComSpec || 'cmd.exe' : step.command
  const args = usesWindowsCommandShim ? ['/d', '/s', '/c', step.command, ...step.args] : step.args
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env: { ...process.env, WRANGLER_LOG_PATH: RELEASE_LOG_PATH },
    stdio: 'inherit',
    shell: false,
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${step.name} 失败（退出码 ${result.status ?? '未知'}）。`)
  }
}

async function verifyAccessProtection(url, options = {}) {
  process.stdout.write('\n==> verify Cloudflare Access protection\n')
  const fetchImpl = options.fetchImpl || fetch
  const wait =
    options.wait || ((delayMs) => new Promise((resolveWait) => setTimeout(resolveWait, delayMs)))
  const attempts = options.attempts || 15
  const delayMs = options.delayMs ?? 2000
  const redirectStatuses = new Set([301, 302, 303, 307, 308])
  let lastStatus = null
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetchImpl(`${url}/api/health`, {
      headers: { 'User-Agent': 'minerva-ranger-release-check/0.4' },
      redirect: 'manual',
    })
    lastStatus = response.status
    const location = response.headers.get('location') || ''
    if (redirectStatuses.has(response.status) && location) {
      process.stdout.write(`Access protection verified: HTTP ${response.status}\n`)
      return
    }
    const deploymentMayStillBePropagating = response.status === 404 || response.status >= 500
    if (!deploymentMayStillBePropagating || attempt === attempts) break
    await wait(delayMs)
  }
  throw new Error(
    `Access 验收失败：未登录请求应被重定向，实际为 HTTP ${lastStatus}。请检查 Access 应用与策略。`,
  )
}

async function main(argv = process.argv.slice(2)) {
  const targetName = argv[0]
  const plan = createReleasePlan(targetName, {
    confirmProduction: argv.includes('--confirm-production'),
  })
  mkdirSync(dirname(plan.backupPath), { recursive: true })
  mkdirSync(dirname(RELEASE_LOG_PATH), { recursive: true })
  process.stdout.write(
    `Cloud release target: ${plan.targetName}\nDatabase: ${plan.target.databaseName}\nBackup: ${plan.backupPath}\n`,
  )
  for (const step of plan.steps) runStep(step)
  await verifyAccessProtection(plan.target.url)
  process.stdout.write(`\n${plan.targetName} release completed.\n`)
}

module.exports = {
  TARGETS,
  createReleasePlan,
  timestampForPath,
  verifyAccessProtection,
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`\nCloud release stopped: ${error.message}\n`)
    process.exitCode = 1
  })
}
