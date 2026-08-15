# 开发交付进度

规格版本：[V0.4 Electron + SQLite 本地持久化规格](v0.4-electron-sqlite-spec.md)

支撑规格：[v0.4 全局巡林官与身份侧面系统策划案](v0.4-global-ranger-spec.md)

检查日期：2026-08-15

目标环境：Windows Electron 桌面安装包；实现分支固定为 `local-desktop`

## 状态汇总

| 状态 | 数量 |
|---|---:|
| 未开始 | 0 |
| 进行中 | 0 |
| 待验证 | 3 |
| 已完成 | 4 |
| 阻塞 | 0 |
| 暂缓 | 0 |

## 交付进度

| 需求引用 | 交付切片 | 状态 | 实现位置 | 验证证据与层级 | 目标环境 | 风险、阻塞或偏差 | 下一步 |
|---|---|---|---|---|---|---|---|
| V040-G01～G04、S01～S08、I01～I06、AC01～AC10 | 冻结版本规格、边界、状态、迁移、恢复、安装/卸载与验收矩阵 | 已完成 | `docs/v0.4-electron-sqlite-spec.md`、Notion 规格 Revision 2、Notion 实施计划 | L1：本地与 Notion 均有稳定 V040 编号；用户新增的安装目录与双路径卸载已进入正式范围 | 项目管理 | 后续范围变化必须先修订规格 | 保持实现、进度和 Notion 证据同步 |
| V040-S01、A01、AC01、AC09 | Electron 43 + node:sqlite 运行时验证 | 已完成 | `package.json`、`scripts/electron-sqlite-probe.cjs` | L2/L3：Electron 43.4.0、Node 24.18.1、SQLite 3.53.1；WAL、事务、重开、integrity_check、在线 backup 通过 | Windows x64 | `node:sqlite` 在 Node 24.18.1 文档中仍为 RC，但目标运行时与安装包均已实测 | 随 Electron 安全版本维护补丁版本 |
| V040-S01、S06、A01、T01～T02、AC07 | 主进程数据库、模式迁移、preload 与 IPC 安全边界 | 已完成 | `electron/persistence/`、`electron/preload.js`、`electron/main.js`、`electron/userDataPath.js`、`index.html` | L2：模式、错误、IPC sender 与 userData 分流测试；L3：真实 preload bridge、SQLite 健康检查及开发/安装运行时路径断言；静态检查通过 | Electron/Windows | 当前使用 `file://` + 严格 sender/path 校验；后续可评估自定义协议 | 保持 preload API 用例化，不暴露任意 IPC/SQL |
| V040-S02、S04、T03～T06、AC04、AC08 | 内存工作副本、串行修订提交、关键操作确认与失败重载 | 已完成 | `src/application/persistence/desktopPersistence.js`、`src/stores/saveStore.js`、身份/地图/收获组件 | L2：渲染适配器、陈旧写入、非法快照和现有玩法回归；`npm test` 全部通过 | Electron + 浏览器兼容 | 浏览器仍用 localStorage 是明确兼容边界，不是桌面事实来源 | 对后续关键用例继续显式调用 `flushPersistence` |
| V040-S03、AC02～AC03 | localStorage 主副本/备份收集、幂等迁移、失败回滚重试 | 待验证 | `src/application/persistence/desktopPersistence.js`、`electron/persistence/database.js`、`migration_log` | L2：损坏主副本回退、指纹、一次迁移、失败回滚重试；L3：新库首次启动和同目录重启通过 | Windows Electron | 尚未用真实历史用户目录做人工作品级核对 | 使用一份真实 V0.3 数据完成 L4 迁移验收 |
| V040-S05～S06、AC05～AC06 | JSON 导入前备份、手动备份、候选校验、受保护恢复、结构化错误 | 待验证 | `electron/persistence/database.js`、`src/App.vue`、`src/components/SaveSlotSelectView.vue` | L2：在线备份/恢复、损坏库、过新模式、只读错误；既有 JSON 导入回归通过 | Windows Electron | 恢复 UI 尚需打包应用内人工点击验收；模拟磁盘写满未做真实设备测试 | 在隔离用户目录人工执行备份→修改→恢复 |
| V040-S07～S08、I01～I06、AC09～AC10 | 生产构建、打包应用、可选安装目录、双路径卸载、覆盖与发布文档 | 待验证 | `package.json`、`installer/installer.nsh`、`scripts/electron-builder-smoke.config.cjs`、`run-installer-smoke.cjs`、`release/` | L2：安装器策略测试；L3/L4：win-unpacked 双启动、隔离 NSIS 自定义目录安装/覆盖/启动、默认卸载保留数据、显式彻底卸载删除应用数据且外部 JSON 保留；隔离原生窗口已验证两个互斥单选项、默认保留和危险确认默认“否”；`v0.4.0-rc.1` Windows x64 候选安装包进入 GitHub 预发布 | Windows x64 | 候选包仍需用户在正式身份下人工确认页面；当前构建未代码签名；真实旧版本跨版本升级仍待验证 | 安装候选包并走完两个卸载选项后，再评估稳定版 `v0.4.0` |

## 当前风险与偏差

- 无代码阻塞项；V0.4 已进入 `v0.4.0-rc.1` 预发布候选，仍不是稳定发布状态。
- `npm run desktop` 默认使用 `%APPDATA%/minerva-ranger-dev`，安装版继续使用 `%APPDATA%/minerva-ranger`；两者不会再因默认 `userData` 相同而互相修改存档。
- `node:sqlite` 在 Electron 43.4.0 自带 Node 24.18.1 中已完成目标环境实测，但上游文档稳定性仍标为 Release Candidate，后续升级必须继续运行探针和安装包测试。
- npm 11 对项目 `.npmrc` 中 Electron 镜像键给出未来弃用警告；当前下载和构建有效，不影响产物，需要在后续工具链维护中迁移配置方式。
- Node ESM 检查会报告 `MODULE_TYPELESS_PACKAGE_JSON` 性能警告；不能直接添加 `type: module`，否则现有 Electron CommonJS 入口会改变语义，应作为独立工具链清理处理。
- 安装包尚未代码签名。签名不阻塞本地功能验收，但发布前必须明确 Windows 信誉提示与分发策略。
- 安装器破坏性测试使用独立 `com.minerva.ranger.installer-smoke`，已证明两种卸载结果；原生窗口自动化与截图已证明两个互斥单选项、默认保留和二次确认默认“否”。正式身份仍保留一次人工视觉/文案验收。
- 已在浏览器兼容模式实际检查 `1280×720` 的身份入口与地图主工作区，DOM 语义、按钮可达性和首屏无溢出；桌面专属加载/恢复状态仍按上表保留打包应用人工验收。
- 本轮发布目标为 GitHub 预发布 [`v0.4.0-rc.1`](https://github.com/666feiyu666/minerva-ranger/releases/tag/v0.4.0-rc.1)；`local-desktop` 与 `main` 必须保持在同一候选提交，稳定版标签继续保留。

## 下一步验收

1. 用真实 V0.3/localStorage 用户目录执行迁移并逐项核对身份、全局巡林官、地图、笔记和运行任务。
2. 在打包应用中人工执行“创建备份 → 修改数据 → 恢复备份”。
3. 安装 `v0.4.0-rc.1` 候选安装包，确认卸载页显示两个互斥单选项；分别人工执行默认保留数据和选择彻底删除的交互卸载，核对二次确认文案。
4. 如果能取得旧版安装包，执行真实旧版本到 V0.4 的覆盖升级；否则记录同版本覆盖安装证据的边界。
5. 完成后回写 Notion 任务验证证据，再决定里程碑是否进入“待发布”。
