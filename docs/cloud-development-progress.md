# V0.4 Cloud 网络版交付进度

规格版本：[V0.4 Cloud 网络版规格](v0.4-cloud-spec.md)

检查日期：2026-08-16

目标环境：Windows/macOS 现代桌面浏览器；Cloudflare Worker + Static Assets + Access + D1；实现分支 `cloud`

## 版本与环境约定

- 产品版本：`V0.4`，与当前本地端的功能阶段一致。
- 运行载体：`V0.4 Desktop` 与 `V0.4 Cloud`；Cloud 是同一产品版本的网络运行方式，不是 `V0.5` 或 `V0.6`。
- 部署环境：`local`、`development`、`production`；环境升级不改变产品版本。
- 构建标识：Git commit、Worker Version 与部署时间用于区分具体构建，不替代产品版本号。

## 状态汇总

| 状态   | 数量 |
| ------ | ---: |
| 未开始 |    1 |
| 进行中 |    0 |
| 待验证 |    1 |
| 已完成 |    8 |
| 阻塞   |    0 |
| 暂缓   |    0 |

## 交付进度

| 需求引用                               | 交付切片                                                                                     | 状态   | 实现位置                                                                                                                                                | 验证证据与层级                                                                                                                                                           | 目标环境                       | 风险、阻塞或偏差                                                       | 下一步                                          |
| -------------------------------------- | -------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------- |
| V040-C-G01～G05、S01～S08、AC01～AC08  | 稳定编号的版本边界、流程、状态、接口和验收规格                                               | 已完成 | `docs/v0.4-cloud-spec.md`                                                                                                                               | L1：目标用户、在线优先、非目标、外部依赖和恢复路径已闭合；真实预览资源已记录                                                                                             | 项目管理                       | 第二位邀请用户与 macOS 设备仍需最终验收                                | 完成允许/拒绝账号和跨设备验收                   |
| V040-C-G03、S01、S04～S07、AC01        | 桌面/Cloud/浏览器三种持久化运行时与共享快照适配                                              | 已完成 | `src/application/persistence/snapshotStorage.js`、`desktopPersistence.js`、`cloudPersistence.js`、`persistenceRuntime.js`、`saveStore.js`               | L2/L3：V0.4 61 项回归、10 项 Workers/D1 测试与 Desktop/Cloud 构建通过；真实 Development 和 Production 均完成 D1 读写与刷新恢复                                           | Vue/Pinia、Electron、浏览器    | Cloud 首期不承诺离线关闭页面后的恢复                                   | 保持关键操作显式 flush，并观察真实网络延迟      |
| V040-C-S02～S03、S08、AC02、AC07       | Worker Access JWT、同源校验、载荷限制、结构化错误与安全日志                                  | 已完成 | `worker/auth.mjs`、`validation.mjs`、`responses.mjs`、`index.mjs`                                                                                       | L2/L3：10 项 Workers/D1/Access 配置测试通过；未登录首页与 API 均由 Access 以 `302` 拦截；owner OTP 登录后的 JWT 验证、GET/PUT `200` 和日志脱敏已在真实 preview 验证      | Cloudflare Workers             | 无当前实现偏差；继续保留 JWT 二次验证                                  | 邀请新用户前复用 allow/deny 验收清单            |
| V040-C-S01、S03、AC02～AC03            | D1 模式、每用户快照、修订号 CAS 与幂等写入                                                   | 已完成 | `migrations/0001_cloud_snapshots.sql`、`worker/snapshotRepository.mjs`、`tests/cloud/snapshotApi.test.mjs`                                              | L2/L3：10 项 Workers/D1 测试通过；两个远程 D1 已应用迁移；Production 保持 1 条账号快照、修订号 6、载荷 16,475 字节；Development 独立为修订号 3、载荷 1,950 字节          | Miniflare/D1、Cloudflare D1    | 单快照上限固定 1.5 MB；不是关系化协作模型                              | 观察 1～10 位试用用户的真实快照大小和延迟       |
| V040-C-G01、S04～S06、AC03、AC05～AC06 | 云端初始化、同步徽标、邀请制账号、退出登录、环境与最近同步时间、离线/错误/冲突反馈与恢复入口 | 已完成 | `src/App.vue`、`src/components/CloudAccountPanel.vue`、`src/components/SaveSlotSelectView.vue`                                                          | L2/L3：本地响应式基线通过；真实 Development 与 Production 均显示账号、环境、同步状态、最近同步时间和修订号；Development 改名、刷新恢复并还原，Production 导入后刷新恢复  | Windows 桌面浏览器、Workers/D1 | macOS 真实设备仍归入最终邀请验收；完整离线队列不在当前 V0.4 Cloud 范围 | 在第二台 Windows/macOS 设备执行相同账号登录验收 |
| V040-C-G03、S01、AC01～AC03            | V0.4 Desktop JSON 到 Cloud 身份导入与共享巡林官去重                                          | 已完成 | `src/stores/saveStore.js`、`src/components/SaveSlotSelectView.vue`、`scripts/validate-cloud-imports.cjs`、`tests/localPersistence.integration.test.mjs` | L2/L3：三个实际 JSON 结构校验及本地导入通过；Production 以一次覆盖、两次新建导入三个身份，刷新后保持开发设计师 5/7/12、人类学家 3/3/0、学者 2/1/1，巡林官仍为 Lv.7/47 棵 | V0.4 Desktop → V0.4 Cloud      | 个人 JSON 不进入代码仓库；远程写入前已有身份导出与完整 D1 SQL 双重备份 | 后续按发布链定期备份并验证恢复                  |
| V040-C-G05、AC01～AC03                 | Wrangler、Vite Cloudflare 插件、生成类型和本地开发命令                                       | 已完成 | `wrangler.jsonc`、`vite.config.js`、`vitest.config.mjs`、`worker-configuration.d.ts`、`package.json`                                                    | L2/L3：配置类型已生成；双环境构建、dry-run 与真实发布通过；Development D1 ID、Access audience 和 Production 资源均已回填                                                 | 本地与远程 Cloudflare 工具链   | 无当前实现偏差                                                         | 后续所有远程升级只使用对应 release 命令         |
| V040-C-G05、S01～S03、AC02～AC04       | Development/Production 数据隔离、备份、迁移、发布与 Access 冒烟链路                          | 已完成 | `scripts/cloud-release.cjs`、`tests/cloudRelease.test.cjs`、`.gitignore`、`package.json`                                                                | L2/L3：两个数据库不混用；D1 导出严格早于迁移与部署；Windows 命令启动修复由两条真实发布链验证，部署传播 404 有回归测试；双环境未登录请求均返回 `302`                      | Cloudflare Workers/D1/Access   | 无当前实现偏差；备份目录被 Git 忽略                                    | 将 release 命令作为唯一远程升级入口             |
| V040-C-A02、AC04、AC07～AC08           | Cloudflare 当前正式资源、Access 允许名单、迁移与部署                                         | 待验证 | `wrangler.jsonc` production 环境；远程资源见下方部署记录                                                                                                | L3：D1、Worker/Assets、Zero Trust、OTP、Self-hosted app 和 owner allow 策略已部署；未登录 `302`、owner JWT/读写/刷新、账号面板、三身份导入和日志脱敏通过                 | Cloudflare 账号                | 未允许账号的真实拒绝路径尚无第二账号证据                               | 用未列入策略的第二邮箱验证拒绝路径              |
| V040-C-AC05～AC06                      | Windows/macOS 跨设备试用、双窗口冲突与邀请用户验收                                           | 未开始 | 待记录目标环境证据                                                                                                                                      | 尚无 L4 用户验收                                                                                                                                                         | Windows/macOS                  | macOS 与第二位真实账号需要外部设备/人员                                | Access 完成后执行邀请试用清单                   |

## 当前临时 Production 部署记录

| 资源              | 值                                                                             | 当前状态                                                |
| ----------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| D1                | `minerva-ranger-cloud-preview` / `2d7ade0e-7b44-48d7-aa5c-d5318d2046ea` / APAC | `0001_cloud_snapshots.sql` 已应用，无待执行迁移         |
| Worker            | `minerva-ranger-cloud-preview`                                                 | 已部署                                                  |
| URL               | `https://minerva-ranger-cloud-preview.feiyut666.workers.dev`                   | 完整域名已由 Access 保护；未登录首页与 API 均返回 `302` |
| Version           | `52df0ade-29f1-4bb1-ae4d-4995f7ea7715`                                         | V0.4 Cloud Production 发布链已完成                      |
| Zero Trust        | `Minerva Ranger` / `minerva-ranger-feiyut.cloudflareaccess.com`                | 已启用；24 小时会话；未启用全局 unmatched deny          |
| Identity provider | `Email one-time PIN` / `5fa2f3eb-9b0e-4caa-81fd-01148c9ae4d3`                  | 已启用并绑定预览应用                                    |
| Access app        | `Minerva Ranger Preview` / `1d51cd92-f7d4-4e78-84c9-69509e484f5a`              | audience 已写入 `POLICY_AUD`                            |
| Access policy     | `Allow preview owner` / `9c61ed67-78d8-4c4f-85a1-8dfcb8434eed`                 | 当前仅允许 `feiyut666@gmail.com`                        |

当前账号在本轮写入前仅含一个空白的“开发设计师”身份（3 个默认技能、0 个行动、0 个笔记）；应用身份备份位于 `.cloudflare-backups/production/2026-08-16_13-02-14_before-import_identity.json`，完整 D1 SQL 备份位于 `.cloudflare-backups/production/2026-08-16_before-v04-release.sql` 与发布链生成的 `.cloudflare-backups/production/2026-08-16_05-19-07-813.sql`。这些文件均被 Git 忽略。

## Development 部署记录

| 资源          | 值                                                                                 | 当前状态                                         |
| ------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------ |
| D1            | `minerva-ranger-cloud-development` / `dcfa7bdc-efcf-4fbd-8bf0-8a53c83a086a` / APAC | `0001_cloud_snapshots.sql` 已应用；与正式库隔离  |
| Worker        | `minerva-ranger-cloud-development`                                                 | 已部署                                           |
| URL           | `https://minerva-ranger-cloud-development.feiyut666.workers.dev`                   | 完整域名由独立 Access 应用保护；未登录返回 `302` |
| Version       | `769470ac-2811-4376-b4f9-728a147372a7`                                             | V0.4 Cloud Development 发布链已完成              |
| Access app    | `Minerva Ranger Development` / `6e2d5e28-0be0-4cf5-9f8c-aac27f3ebdd7`              | audience 已写入 Development `POLICY_AUD`         |
| Access policy | `Allow development owner` / `08d252c2-5e69-4156-9ea2-48ef45f103f7`                 | 当前仅允许 `feiyut666@gmail.com`                 |

Development 备份位于 `.cloudflare-backups/development/2026-08-16_05-16-32-090.sql`；真实改名、刷新恢复、还原后数据库保持 1 条快照、修订号 3、载荷 1,950 字节。

## 当前风险与偏差

- 代码没有回退到 localStorage 的云端降级路径，这是为避免用户误以为已同步而形成数据分叉的刻意选择。
- 页面关闭前的短暂未同步修改仍受浏览器生命周期影响；首期通过 1.2 秒合并写入和关键操作显式 flush 降低风险，但完整离线队列属于后续版本。
- Cloudflare Access 的 owner allow 路径已经完成真实 OTP、JWT、读写和刷新验证；未允许账号拒绝与 macOS 跨设备仍需外部账号/设备证据。
- Wrangler 使用加密存储的 OAuth 凭据，仅具备本次需要的 Workers/D1 写入与账号读取权限；Zero Trust Access 通过已连接的 Cloudflare API 创建，没有使用全局 Full Access Token。
- 静态资源中存在多张 2.5～8.8 MB 图片，功能构建成功但首次加载性能可能影响异地用户；部署后应进行真实性能测量，再决定压缩策略。
- Electron 仍保持 CommonJS，因此 Vite 配置通过按模式动态导入 ESM-only Cloudflare 插件，不能直接把整个 package 切换为 `type: module`。

## 下一次状态更新条件

1. 用未列入策略的第二邮箱验证 Access 拒绝路径后，把正式资源切片改为“已完成”。
2. Windows/macOS 与双窗口冲突验收完成后，把 V0.4 Cloud 标记为“可邀请试用”。
3. 首次异地设备试用后记录静态大图的实际加载性能，再决定是否进入压缩切片。

## 运行问题记录

### 2026-08-16 Access issuer URL 缺少协议

- 影响：owner 通过 Access OTP 后能进入静态应用，但 `/api/snapshot` 返回 `ACCESS_NOT_CONFIGURED`，页面显示“云端同步错误”。
- 原因：`TEAM_DOMAIN` 配置为裸域名，而 Cloudflare 官方 JWT 验证契约要求 `https://<team>.cloudflareaccess.com` 完整 issuer URL。
- 修复：预览环境改为完整 HTTPS URL；`worker/auth.mjs` 同时规范化裸域名并拒绝 HTTP、端口、路径、查询和片段；增加 3 项配置回归测试。
- 目标环境证据：版本 `21a9fa4c-4c96-46ee-b942-38e02b06581c` 中 owner API GET/PUT 均为 `200`；改名后刷新恢复成功并已还原原名；D1 为 1 条快照、最高修订 3、载荷 1950 字节。
- 日志证据：查询到 7 条 `api_request` 事件，只含请求 ID、方法、路径、状态、耗时和 12 位主体哈希；没有 JWT、email 或快照正文。
