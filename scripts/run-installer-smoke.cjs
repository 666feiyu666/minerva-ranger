const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const {
  existsSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')

const repoRoot = path.resolve(__dirname, '..')
const installerPath = path.join(
  repoRoot,
  'release',
  'installer-smoke',
  'MinervaRangerSmoke Setup 0.4.0.exe',
)
if (!existsSync(installerPath)) {
  throw new Error('缺少隔离的 V0.4 NSIS 测试安装包，请先运行 npm run dist:installer-smoke。')
}

const smokeDirectory = mkdtempSync(path.join(tmpdir(), 'minerva-installer-'))
const preserveInstallDirectory = path.join(smokeDirectory, 'preserve-installed')
const deleteInstallDirectory = path.join(smokeDirectory, 'delete-installed')
const externalExportPath = path.join(smokeDirectory, 'external-export.json')
const smokeUserDataDirectory = path.join(process.env.APPDATA, 'MinervaRangerSmoke')
const databasePath = path.join(smokeUserDataDirectory, 'data', 'minerva-ranger.sqlite3')
const uninstallerPaths = new Set()

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env,
    stdio: 'inherit',
    timeout: 60000,
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${path.basename(command)} 退出码为 ${result.status ?? 'unknown'}。`)
  }
}

function findUninstaller(installDirectory) {
  const uninstallerPath = readdirSync(installDirectory)
    .filter((name) => /^Uninstall.*\.exe$/i.test(name))
    .map((name) => path.join(installDirectory, name))[0]
  assert.ok(uninstallerPath, '安装目录缺少卸载程序。')
  uninstallerPaths.add(uninstallerPath)
  return uninstallerPath
}

function launchInstalled(executablePath, smokeRun) {
  run(executablePath, [], {
    ...process.env,
    MINERVA_SMOKE_RUN: smokeRun,
    MINERVA_SMOKE_TEST: '1',
  })
}

async function waitFor(predicate, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (predicate()) return true
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return predicate()
}

async function uninstall(uninstallerPath, extraArgs = []) {
  run(uninstallerPath, ['/S', '/currentuser', ...extraArgs])
  return waitFor(() => !existsSync(uninstallerPath))
}

async function main() {
  try {
    assert.ok(process.env.APPDATA, 'Windows APPDATA 环境变量不可用。')
    if (existsSync(smokeUserDataDirectory)) {
      rmSync(smokeUserDataDirectory, { recursive: true, force: true })
    }

    run(installerPath, ['/S', '/currentuser', `/D=${preserveInstallDirectory}`])
    const preserveExecutable = path.join(preserveInstallDirectory, 'MinervaRangerSmoke.exe')
    assert.ok(existsSync(preserveExecutable), '自定义安装目录中没有生成主程序。')
    const preserveUninstaller = findUninstaller(preserveInstallDirectory)

    launchInstalled(preserveExecutable, 'installed-app-custom-directory')
    assert.ok(existsSync(databasePath), '安装后的应用没有创建 SQLite 数据库。')

    run(installerPath, ['/S', '/currentuser', `/D=${preserveInstallDirectory}`])
    assert.ok(existsSync(preserveExecutable), '覆盖安装后主程序缺失。')
    launchInstalled(preserveExecutable, 'installed-app-after-overwrite')
    assert.ok(existsSync(databasePath), '覆盖安装后 SQLite 数据丢失。')

    assert.equal(await uninstall(preserveUninstaller), true, '默认卸载没有完成。')
    assert.ok(existsSync(databasePath), '默认卸载应保留 SQLite 用户数据。')

    run(installerPath, ['/S', '/currentuser', `/D=${deleteInstallDirectory}`])
    const deleteExecutable = path.join(deleteInstallDirectory, 'MinervaRangerSmoke.exe')
    assert.ok(existsSync(deleteExecutable), '彻底卸载测试安装没有生成主程序。')
    const deleteUninstaller = findUninstaller(deleteInstallDirectory)
    launchInstalled(deleteExecutable, 'installed-app-before-full-delete')
    assert.ok(existsSync(databasePath), '彻底卸载前缺少 SQLite 用户数据。')

    writeFileSync(externalExportPath, '{"external":true}\n', 'utf8')
    assert.equal(
      await uninstall(deleteUninstaller, ['--delete-app-data']),
      true,
      '显式彻底卸载没有完成。',
    )
    assert.equal(
      await waitFor(() => !existsSync(smokeUserDataDirectory)),
      true,
      '彻底卸载没有清理应用数据目录。',
    )
    assert.ok(existsSync(externalExportPath), '彻底卸载不应删除外部导出的 JSON。')

    console.log(
      JSON.stringify({
        ok: true,
        customInstallDirectory: true,
        overwriteInstalled: true,
        defaultUninstallPreservedData: true,
        explicitUninstallDeletedData: true,
        externalExportPreserved: true,
        isolatedAppId: 'com.minerva.ranger.installer-smoke',
      }),
    )
  } finally {
    for (const uninstallerPath of uninstallerPaths) {
      if (existsSync(uninstallerPath)) {
        spawnSync(uninstallerPath, ['/S', '/currentuser'], {
          stdio: 'ignore',
          timeout: 60000,
        })
        await waitFor(() => !existsSync(uninstallerPath))
      }
    }
    if (existsSync(smokeUserDataDirectory)) {
      rmSync(smokeUserDataDirectory, { recursive: true, force: true })
    }
    await new Promise((resolve) => setTimeout(resolve, 5000))
    rmSync(smokeDirectory, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
