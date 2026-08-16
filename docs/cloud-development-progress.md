# V0.5 Cloudflare 网络版交付进度

规格版本：[V0.5 Cloudflare 网络版规格](v0.5-cloud-spec.md)

检查日期：2026-08-16

目标环境：Windows/macOS 现代桌面浏览器；Cloudflare Worker + Static Assets + Access + D1；实现分支 `cloud`

## 状态汇总

| 状态   | 数量 |
| ------ | ---: |
| 未开始 |    1 |
| 进行中 |    0 |
| 待验证 |    1 |
| 已完成 |    6 |
| 阻塞   |    0 |
| 暂缓   |    0 |

## 交付进度

| 需求引用                             | 交付切片                                                     | 状态   | 实现位置                                                                                                                                  | 验证证据与层级                                                                                                                                                      | 目标环境                            | 风险、阻塞或偏差                                            | 下一步                                           |
| ------------------------------------ | ------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| V050-G01～G05、S01～S08、AC01～AC08  | 稳定编号的版本边界、流程、状态、接口和验收规格               | 已完成 | `docs/v0.5-cloud-spec.md`                                                                                                                 | L1：目标用户、在线优先、非目标、外部依赖和恢复路径已闭合；真实预览资源已记录                                                                                        | 项目管理                            | 第二位邀请用户与 macOS 设备仍需最终验收                     | 完成允许/拒绝账号和跨设备验收                    |
| V050-G03、S01、S04～S07、AC01        | 桌面/Cloud/浏览器三种持久化运行时与共享快照适配              | 已完成 | `src/application/persistence/snapshotStorage.js`、`desktopPersistence.js`、`cloudPersistence.js`、`persistenceRuntime.js`、`saveStore.js` | L2：V0.4 53 项回归通过；桌面生产构建与 Cloud 构建通过                                                                                                               | Vue/Pinia、Electron、浏览器         | Cloud 首期不承诺离线关闭页面后的恢复                        | 保持关键操作显式 flush，并观察真实网络延迟       |
| V050-S02～S03、S08、AC02、AC07       | Worker Access JWT、同源校验、载荷限制、结构化错误与安全日志  | 已完成 | `worker/auth.mjs`、`validation.mjs`、`responses.mjs`、`index.mjs`                                                                         | L2/L3：10 项 Workers/D1/Access 配置测试通过；未登录首页与 API 均由 Access 以 `302` 拦截；owner OTP 登录后的 JWT 验证、GET/PUT `200` 和日志脱敏已在真实 preview 验证 | Cloudflare Workers                  | 无当前实现偏差；继续保留 JWT 二次验证                       | 邀请新用户前复用 allow/deny 验收清单             |
| V050-S01、S03、AC02～AC03            | D1 模式、每用户快照、修订号 CAS 与幂等写入                   | 已完成 | `migrations/0001_cloud_snapshots.sql`、`worker/snapshotRepository.mjs`、`tests/cloud/snapshotApi.test.mjs`                                | L2/L3：7 项 Workers + D1 集成测试通过；远程 D1 已应用迁移；owner 真实改名、同步、刷新恢复、还原成功，数据库保持 1 条快照且最高修订为 3                              | Miniflare/D1、Cloudflare D1         | 单快照上限固定 1.5 MB；不是关系化协作模型                   | 观察 1～10 位试用用户的真实快照大小和延迟        |
| V050-G01、S04～S06、AC03、AC05～AC06 | 云端初始化、同步徽标、账号显示、离线/错误/冲突反馈与恢复入口 | 已完成 | `src/App.vue`、`src/components/SaveSlotSelectView.vue`                                                                                    | L2/L3：构建通过；本地真实浏览器完成改名写入、刷新恢复、双窗口陈旧写入、明确恢复；检查 `920×680`、`1280×720`、`1600×900`，修复低高度说明裁切                         | Windows 桌面浏览器、本地 Workers/D1 | macOS 真实设备仍归入最终邀请验收；完整离线队列不在 V0.5     | 远程 Access 完成后复用相同流程验证               |
| V050-G05、AC01～AC03                 | Wrangler、Vite Cloudflare 插件、生成类型和本地开发命令       | 已完成 | `wrangler.jsonc`、`vite.config.js`、`vitest.config.mjs`、`worker-configuration.d.ts`、`package.json`                                      | L2：配置类型已生成；Cloud Worker 与客户端双构建通过                                                                                                                 | 本地 Cloudflare 工具链              | 根配置有意仅允许 localhost 开发身份，不能直接当远程正式配置 | 回填远程环境后重新生成类型并 dry-run             |
| V050-A02、AC04、AC07～AC08           | Cloudflare 真实预览资源、Access 允许名单、迁移与部署         | 待验证 | `wrangler.jsonc` preview 环境；远程资源见下方部署记录                                                                                     | L3：D1、Worker/Assets、Zero Trust、OTP、Self-hosted app 和 owner allow 策略均已部署；未登录拦截、owner 登录、JWT、远程读写、刷新恢复和日志脱敏通过                  | Cloudflare 账号                     | 未允许账号的真实拒绝路径尚无第二账号证据                    | 用未列入策略的邮箱验证拒绝，再进入跨设备邀请试用 |
| V050-AC05～AC06                      | Windows/macOS 跨设备试用、双窗口冲突与邀请用户验收           | 未开始 | 待记录目标环境证据                                                                                                                        | 尚无 L4 用户验收                                                                                                                                                    | Windows/macOS                       | macOS 与第二位真实账号需要外部设备/人员                     | Access 完成后执行邀请试用清单                    |

## Preview 部署记录

| 资源              | 值                                                                             | 当前状态                                                |
| ----------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| D1                | `minerva-ranger-cloud-preview` / `2d7ade0e-7b44-48d7-aa5c-d5318d2046ea` / APAC | `0001_cloud_snapshots.sql` 已应用，无待执行迁移         |
| Worker            | `minerva-ranger-cloud-preview`                                                 | 已部署                                                  |
| URL               | `https://minerva-ranger-cloud-preview.feiyut666.workers.dev`                   | 完整域名已由 Access 保护；未登录首页与 API 均返回 `302` |
| Version           | `21a9fa4c-4c96-46ee-b942-38e02b06581c`                                         | 已修正并验证 Access issuer URL 的 preview 版本          |
| Zero Trust        | `Minerva Ranger` / `minerva-ranger-feiyut.cloudflareaccess.com`                | 已启用；24 小时会话；未启用全局 unmatched deny          |
| Identity provider | `Email one-time PIN` / `5fa2f3eb-9b0e-4caa-81fd-01148c9ae4d3`                  | 已启用并绑定预览应用                                    |
| Access app        | `Minerva Ranger Preview` / `1d51cd92-f7d4-4e78-84c9-69509e484f5a`              | audience 已写入 `POLICY_AUD`                            |
| Access policy     | `Allow preview owner` / `9c61ed67-78d8-4c4f-85a1-8dfcb8434eed`                 | 当前仅允许 `feiyut666@gmail.com`                        |

## 当前风险与偏差

- 代码没有回退到 localStorage 的云端降级路径，这是为避免用户误以为已同步而形成数据分叉的刻意选择。
- 页面关闭前的短暂未同步修改仍受浏览器生命周期影响；首期通过 1.2 秒合并写入和关键操作显式 flush 降低风险，但完整离线队列属于后续版本。
- Cloudflare Access 的 owner allow 路径已经完成真实 OTP、JWT、读写和刷新验证；未允许账号拒绝与 macOS 跨设备仍需外部账号/设备证据。
- 静态资源中存在多张 2.5～8.8 MB 图片，功能构建成功但首次加载性能可能影响异地用户；部署后应进行真实性能测量，再决定压缩策略。
- Electron 仍保持 CommonJS，因此 Vite 配置通过按模式动态导入 ESM-only Cloudflare 插件，不能直接把整个 package 切换为 `type: module`。

## 下一次状态更新条件

1. 本地 Cloud 模式的真实浏览器页面、刷新恢复与关键同步状态通过后，把界面切片改为“已完成”。
2. 创建远程 D1、应用迁移并完成 Worker/Assets 预览部署后，记录资源名、非秘密 ID、部署版本与 URL。
3. Access 未登录/允许/拒绝三条路径和日志脱敏通过后，把真实资源切片改为“待验证”或“已完成”。
4. Windows/macOS 与双窗口冲突验收完成后，才把 V0.5 标记为“可邀请试用”。

## 运行问题记录

### 2026-08-16 Access issuer URL 缺少协议

- 影响：owner 通过 Access OTP 后能进入静态应用，但 `/api/snapshot` 返回 `ACCESS_NOT_CONFIGURED`，页面显示“云端同步错误”。
- 原因：`TEAM_DOMAIN` 配置为裸域名，而 Cloudflare 官方 JWT 验证契约要求 `https://<team>.cloudflareaccess.com` 完整 issuer URL。
- 修复：预览环境改为完整 HTTPS URL；`worker/auth.mjs` 同时规范化裸域名并拒绝 HTTP、端口、路径、查询和片段；增加 3 项配置回归测试。
- 目标环境证据：版本 `21a9fa4c-4c96-46ee-b942-38e02b06581c` 中 owner API GET/PUT 均为 `200`；改名后刷新恢复成功并已还原原名；D1 为 1 条快照、最高修订 3、载荷 1950 字节。
- 日志证据：查询到 7 条 `api_request` 事件，只含请求 ID、方法、路径、状态、耗时和 12 位主体哈希；没有 JWT、email 或快照正文。
