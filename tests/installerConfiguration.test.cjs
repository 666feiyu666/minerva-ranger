const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const repoRoot = path.resolve(__dirname, '..')
const packageMetadata = require('../package.json')
const smokeConfig = require('../scripts/electron-builder-smoke.config.cjs')
const installerInclude = readFileSync(
  path.join(repoRoot, 'installer', 'installer.nsh'),
  'utf8',
)

test('NSIS 使用可选择安装目录的引导式安装器', () => {
  assert.deepEqual(packageMetadata.build.nsis, {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false,
    include: 'installer/installer.nsh',
  })
})

test('交互卸载提供两个互斥选项并默认保留数据', () => {
  assert.match(installerInclude, /UninstPage custom un\.minervaUninstallChoicePageCreate/)
  assert.match(installerInclude, /NSD_CreateRadioButton[^\n]+仅删除应用（推荐）/)
  assert.match(installerInclude, /NSD_CreateRadioButton[^\n]+删除应用及全部本地数据/)
  assert.match(installerInclude, /NSD_Check[^\n]+minervaKeepUserDataRadio/)
  assert.match(installerInclude, /MUI_PAGE_CUSTOMFUNCTION_PRE un\.minervaSkipUninstallComponentsPage/)
})

test('彻底删除需要二次确认且只在主卸载后的隐藏 uninstaller section 执行', () => {
  assert.match(installerInclude, /MB_DEFBUTTON2/)
  assert.match(installerInclude, /此操作不可撤销，是否继续？/)
  assert.match(installerInclude, /Section "un\.-应用数据清理策略"/)
  assert.match(installerInclude, /\$\{AndIfNot\} \$\{isUpdated\}/)
  assert.match(installerInclude, /deleteMinervaUserDataAt "\$APPDATA"/)
})

test('安装器破坏性冒烟测试使用独立应用身份', () => {
  assert.equal(smokeConfig.appId, 'com.minerva.ranger.installer-smoke')
  assert.equal(smokeConfig.productName, 'MinervaRangerSmoke')
  assert.equal(smokeConfig.extraMetadata.name, 'minerva-ranger-smoke')
  assert.notEqual(smokeConfig.appId, packageMetadata.build.appId)
})
