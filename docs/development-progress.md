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
| 待验证 | 0 |
| 已完成 | 7 |
| 阻塞 | 0 |
| 暂缓 | 0 |

## 交付进度

| 需求引用 | 交付切片 | 状态 | 实现位置 | 验证证据与层级 | 目标环境 | 风险、阻塞或偏差 | 下一步 |
|---|---|---|---|---|---|---|---|
| V040-G01～G04、S01～S08、I01～I06、AC01～AC10 | 冻结版本规格、边界、状态、迁移、恢复、安装/卸载与验收矩阵 | 已完成 | `docs/v0.4-electron-sqlite-spec.md`、Notion 规格 Revision 2、Notion 实施计划 | L1：本地与 Notion 均有稳定 V040 编号；用户新增的安装目录与双路径卸载已进入正式范围 | 项目管理 | 后续范围变化必须先修订规格 | 保持实现、进度和 Notion 证据同步 |
| V040-S01、A01、AC01、AC09 | Electron 43 + node:sqlite 运行时验证 | 已完成 | `package.json`、`scripts/electron-sqlite-probe.cjs` | L2/L3：Electron 43.4.0、Node 24.18.1、SQLite 3.53.1；WAL、事务、重开、integrity_check、在线 backup 通过 | Windows x64 | `node:sqlite` 在 Node 24.18.1 文档中仍为 RC，但目标运行时与安装包均已实测 | 随 Electron 安全版本维护补丁版本 |
| V040-S01、S06、A01、T01～T02、AC07 | 主进程数据库、模式迁移、preload 与 IPC 安全边界 | 已完成 | `electron/persistence/`、`electron/preload.js`、`electron/main.js`、`electron/userDataPath.js`、`index.html` | L2：模式、错误、IPC sender 与 userData 分流测试；L3：真实 preload bridge、SQLite 健康检查及开发/安装运行时路径断言；静态检查通过 | Electron/Windows | 当前使用 `file://` + 严格 sender/path 校验；后续可评估自定义协议 | 保持 preload API 用例化，不暴露任意 IPC/SQL |
| V040-S02、S04、T03～T06、AC04、AC08 | 内存工作副本、串行修订提交、关键操作确认与失败重载 | 已完成 | `src/application/persistence/desktopPersistence.js`、`src/stores/saveStore.js`、身份/地图/收获组件 | L2：渲染适配器、陈旧写入、非法快照和现有玩法回归；`npm test` 全部通过 | Electron + 浏览器兼容 | 浏览器仍用 localStorage 是明确兼容边界，不是桌面事实来源 | 对后续关键用例继续显式调用 `flushPersistence` |
| V040-S03、AC02～AC03 | localStorage 主副本/备份收集、幂等迁移、失败回滚重试 | 已完成 | `src/application/persistence/desktopPersistence.js`、`electron/persistence/database.js`、`migration_log` | L2：损坏主副本回退、指纹、一次迁移、失败回滚重试；L3：新库首次启动和同目录重启；L4：用户把真实 V0.3 以前历史数据导入 Electron SQLite，未发现阻断问题 | Windows Electron | 自动化与真实旧数据验证已闭合发布风险 | 后续版本继续保留真实历史档案回归样本 |
| V040-S05～S06、AC05～AC06 | JSON 导入前备份、手动备份、候选校验、受保护恢复、结构化错误 | 已完成 | `electron/persistence/database.js`、`src/App.vue`、`src/components/SaveSlotSelectView.vue` | L2：在线备份/恢复、损坏库、过新模式、只读错误与 JSON 导入回归；L4：真实旧数据导入 SQLite 成功 | Windows Electron | 真实磁盘写满与更多设备恢复演练作为发布后强化，不阻塞 V0.4 | 持续补充真实设备故障演练 |
| V040-S07～S08、I01～I06、AC09～AC10 | 生产构建、打包应用、可选安装目录、双路径卸载、覆盖与发布文档 | 已完成 | `package.json`、`installer/installer.nsh`、`scripts/electron-builder-smoke.config.cjs`、`run-installer-smoke.cjs`、`release/` | L2：安装器策略与 53 项全量测试；L3/L4：开发/打包双启动、userData 分流、隔离 NSIS 自定义目录安装/覆盖/启动、默认保留数据、显式彻底卸载、外部 JSON 保留和原生双选项验证；`v0.4.0` Windows x64 正式发布 | Windows x64 | 当前安装包未代码签名，Windows 可能显示 SmartScreen；真实旧版安装器矩阵作为后续强化 | 收集稳定版运行反馈并准备签名策略 |

## 当前风险与偏差

- 无代码阻塞项；用户已确认真实旧数据导入无重大问题，V0.4 达到稳定发布标准并发布 `v0.4.0`。
- `npm run desktop` 默认使用 `%APPDATA%/minerva-ranger-dev`，安装版继续使用 `%APPDATA%/minerva-ranger`；两者不会再因默认 `userData` 相同而互相修改存档。
- `node:sqlite` 在 Electron 43.4.0 自带 Node 24.18.1 中已完成目标环境实测，但上游文档稳定性仍标为 Release Candidate，后续升级必须继续运行探针和安装包测试。
- npm 11 对项目 `.npmrc` 中 Electron 镜像键给出未来弃用警告；当前下载和构建有效，不影响产物，需要在后续工具链维护中迁移配置方式。
- Node ESM 检查会报告 `MODULE_TYPELESS_PACKAGE_JSON` 性能警告；不能直接添加 `type: module`，否则现有 Electron CommonJS 入口会改变语义，应作为独立工具链清理处理。
- 安装包尚未代码签名。签名不阻塞本地功能验收，但发布前必须明确 Windows 信誉提示与分发策略。
- 安装器破坏性测试使用独立 `com.minerva.ranger.installer-smoke`，已证明两种卸载结果；原生窗口自动化与截图已证明两个互斥单选项、默认保留和二次确认默认“否”。正式身份仍保留一次人工视觉/文案验收。
- 已在浏览器兼容模式实际检查 `1280×720` 的身份入口与地图主工作区，DOM 语义、按钮可达性和首屏无溢出；桌面专属加载/恢复状态仍按上表保留打包应用人工验收。
- GitHub 正式版为 [`v0.4.0`](https://github.com/666feiyu666/minerva-ranger/releases/tag/v0.4.0)；`local-desktop`、`main` 与稳定标签保持在同一发布提交。

## 发布后跟进

1. 收集 `v0.4.0` 稳定版的真实运行反馈，优先关注迁移、恢复和卸载结果。
2. 在后续工具链维护中补充代码签名，并扩大真实旧版安装器覆盖矩阵。
3. 将已完成状态、Release 链接、提交与安装包校验值同步到 Notion。
