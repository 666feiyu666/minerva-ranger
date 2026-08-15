# Minerva Ranger v0.4.0

这是 Minerva Ranger V0.4 的 Windows x64 稳定版。

## 本次更新

- 将巡林官成长、金币、收藏、共享地图、累计森林和可移栽树木整合为跨身份共享的全局档案。
- Windows Electron 桌面版改用主进程独占的 SQLite 权威存档，支持事务修订、模式迁移、失败回滚和结构化错误。
- 支持旧 localStorage 一次性迁移并保留原始副本；JSON 导入前自动备份，并提供手动备份与受保护恢复。
- 新增引导式 Windows 安装器，可选择安装范围和程序安装目录。
- 卸载器提供两个互斥选项：默认仅删除应用并保留本地数据，或二次确认后删除应用及全部本地数据。
- Electron 开发态使用独立的 `%APPDATA%/minerva-ranger-dev`，不会读写安装版 `%APPDATA%/minerva-ranger` 中的正式存档。

## 下载与校验

- 安装包：`MinervaRanger-Setup-0.4.0.exe`
- 平台：Windows x64
- SHA-256：`40D65D3BB04663CBB77CB05C7FD219D42F6C270780A973828C843A08FE4875A7`

Windows 可能因为安装包尚未代码签名而显示 SmartScreen 信誉提示。

## 已验证

- `npm run check`
- `npm test`（53/53）
- Electron SQLite 探针、开发态/覆盖目录启动和打包态启动
- NSIS 自定义目录安装、覆盖安装、默认保留数据卸载、显式完整删除和外部 JSON 保留
- 卸载器两个互斥单选项，以及危险操作确认默认选择“否”
- 真实 V0.3 以前历史数据已通过 Electron 开发态导入 SQLite，未发现阻断问题

## 已知边界

- 安装包尚未代码签名，Windows 可能显示 SmartScreen 信誉提示。
- 本版本正式支持 Windows x64；macOS、Linux、云同步和自动更新不在 V0.4 范围内。
