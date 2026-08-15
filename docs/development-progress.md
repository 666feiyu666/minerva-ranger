# 开发交付进度

规格版本：[v0.4 全局巡林官与身份侧面系统策划案](v0.4-global-ranger-spec.md)

检查日期：2026-08-15

本次范围：巡林官全局成长、共享地图与森林、身份侧面隔离、地图 Skill 解耦、旧存档迁移与三分支同步

目标环境：Windows 桌面窗口，本地单机 localStorage 数据链路；目标分支为 `main`、`cloud`、`local-desktop`

## 状态汇总

| 状态 | 数量 |
|---|---:|
| 未开始 | 0 |
| 进行中 | 0 |
| 待验证 | 1 |
| 已完成 | 3 |
| 阻塞 | 0 |
| 暂缓 | 0 |

## 交付进度

| 需求引用 | 交付切片 | 状态 | 实现位置 | 验证证据与层级 | 目标环境 | 风险、阻塞或偏差 | 下一步 |
|---|---|---|---|---|---|---|---|
| SPEC-RANGER-AC-01～06 | 全局巡林官数据所有权、身份侧面隔离、共享种植结算与删除身份规则 | 已完成 | `src/local-backend/domain/rangerProfile.js`、`src/application/persistence/gameSnapshot.js`、`src/stores/saveStore.js`、`src/stores/mapStore.js` | 领域及 localStorage 集成测试；两个身份切换、删除身份与共享进度人工验收 | 本地单机 | 全局累计成果刻意不随身份删除回退 | 保持后续新增资源先明确全局或身份归属 |
| SPEC-RANGER-AC-04～05 | 地图去除 Skill 关联并改为纯叙事激励系统 | 已完成 | `src/components/MapView.vue`、`src/local-backend/domain/mapModel.js`、`src/application/workflows/skillWorkflow.js` | `1024×720`、`1200×800`、`1600×900` 及昼夜模式人工验收；地图 v1→v2 迁移测试 | Windows 桌面窗口 | 地点插画仍是主要包体积来源 | 后续发布优化纳入图片压缩与懒加载预算 |
| SPEC-RANGER-AC-07～10 | 多身份旧档合并、新版导入导出、来源去重、主备份恢复与失败回滚 | 已完成 | `src/local-backend/domain/rangerProfile.js`、`src/local-backend/services/saveService.js`、`src/local-backend/storage/saveSlotRepository.js` | `npm run check`；`npm test` 38/38；临时干净输出目录生产构建通过 | Windows 本地存档 | 常规 `dist/favicon.ico` 被外部进程占用，标准输出目录无法覆盖；使用全新输出目录验证编译链路无误 | 释放占用后可重新生成默认 `dist`，不影响源代码交付 |
| v0.4 三分支交付 | 文档、代码和验证结果同步到 `main`、`cloud`、`local-desktop` | 待验证 | Git 分支与远端引用 | 三个本地分支仅快进到同一提交；远端推送等待明确授权 | 本地 Git 与 GitHub 远端 | 安全审查要求明确授权向 `origin` 推送代码 | 获得授权后推送并用 `git ls-remote origin` 核对远端引用 |

## 当前风险与阻塞

- 当前无产品或代码阻塞项。
- 默认 `dist` 目录中的 `favicon.ico` 在本机被其他进程占用；同一生产构建在全新的临时输出目录成功，因此归类为本地输出目录占用，而非构建产物错误。
- 全局档案使用本地设备级存储，本轮不提供账号或云端数据同步；`cloud` 分支只表示代码交付分支，不改变这一产品边界。
- GitHub 远端推送需经过明确的代码外传授权；在授权前只同步本地分支。

## 下一批交付切片

1. 建立 `1.0.0` 正式版发布清单与验收门槛。
2. 执行 Electron Windows 安装包、升级、卸载和数据保留验证。
3. 为剩余地点补充正式场景插画，并优化现有图片体积。
