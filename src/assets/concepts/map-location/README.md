# 地图与地点概念图

本目录保存 2026-08-15 使用 `D:\Project\DH-Automation\image-generation` 生成并整理进 `mr-script` 的首轮视觉示意图。

这些文件已经作为 v0.3 地图与场景图志的正式运行资源接入 `src/config/mapCatalog.js`：

- `minerva-map-concept.png`：从第二张地图候选继续编辑得到的地图方向稿。
- `ranger-camp.png`：巡林营地。
- `mist-lake-dock.png`：雾湖码头。
- `willowwind-library.png`：柳风图书馆。
- `high-ridge-lookout.png`：高脊瞭望台。

生成提示词和完整 `run.json` 保存在 `art-reference/generated/`。该目录当前被 `.gitignore` 忽略，仅作为本地生成记录；运行代码只引用本目录中的稳定命名资源，不依赖 `art-reference/`。

已知问题：

- 地图仍有一处类似文字的细节，瞭望台仍带旗帜。
- 柳风图书馆前景纸页包含不可读的线条。
- 高脊瞭望台出现了一个小型人物剪影。

v0.3 已完成 `1024×720`、`1200×800` 与 `1600×1000` 桌面视口裁切验收。其余四个地点暂用可操作的图志占位，后续版本可补充正式插画，并继续压缩当前大图体积。
