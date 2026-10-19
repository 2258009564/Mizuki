# Mizuki → Shirone 迁移记录

2026-10-19，将 alisa22580 的博客从 Mizuki 迁移至 Shirone 1.0.3，基于上游 `f92fbbe0e6f9991b7b65017bbe23ed19cd0cbc67`。原版本为 `a479816007607bfad6b69ff0002e641b6b19b646`。

## 保留的个人内容

- `src/content` 中的 23 篇文章（13 篇已发布、10 篇草稿）和关于页面，源文件与图片逐文件校验一致。保留所有旧文章 URL、置顶状态、草稿状态和评论开关。
- 站点域名 `https://alisa22580.com/`、标题、中文语言、主题色、头像、简介、社交链接、个人横幅及轮播文案、Twikoo 后端和公告。
- 6 条日记转换至 `src/content/moments/`；旧 `/diary/` 自动跳转至 `/moments/`。
- 40 部追番转换为 Shirone 的 Bangumi 快照；`pnpm.cmd anime:sync --provider bangumi` 可显式刷新，构建读取快照，失败时使用本地迁移数据。
- 友链、55 条技能、9 条时间线以及设备资料；项目页保留迁移时按旧 GitHub 逻辑获取的 15 条项目及精选、状态覆盖结果，改为新主题的本地数据。旧字段与原脚本保存在 `legacy/`，项目后续在 `src/data/projects.ts` 维护。
- 原设备页、工具箱等已关闭功能继续保持不出现在导航中的状态。工具箱与技能编辑器的旧代码可从恢复分支取得；其数据已归档，不冒充新主题原生功能。

## 字体与小人

MapleMono NF CN Regular 400 保留为正文、中英文与代码字体。原始 TTF 保留在 `src/assets/fonts/`，生产使用全量转换的 WOFF2，没有按文章裁剪字符。转换前后 33,042 个字形的字符映射、字形计数、字体命名、水平字宽和样式数据一致，详见 `font-verification.json`。完整字库约 6.05 MiB，字体预算显式设为 12 MiB；构建检查实际只引用一个去重后的字体资源。旧字体文件归档在 `legacy/fonts/`。

保留原 UGOfficial 模型、贴图、动作、表情、语录、位置、拖拽、隐藏与恢复行为。保留原移动端隐藏偏好，在移动端不加载模型运行时。Cubism Core 改为从站内按需加载，避免 Vite 8 将旧包的 Node 分支打进浏览器。组件在 Swup 替换容器外保持同一实例。

小人的对话气泡改用新主题的语义前景色和背景色，并通过更精确的选择器覆盖旧样式；关闭气泡时立即隐藏，避免透明度过渡期间的文字对比度下降。该修复覆盖暗色模式。

还修复了旧交互代码中“刚拖拽后快速隐藏，再点恢复会被当成拖拽派生点击而忽略”的边界情况：新的按下手势会清除旧点击抑制窗口，键盘激活恢复按钮也不受该窗口影响。

本站关闭桌面目录，因而页面没有 `#toc`。Swup 只替换 `main`，防止因缺少必选目录容器而退回整页刷新。将来启用桌面目录时应同步重新评估容器与目录更新策略。

音乐采用 Shirone 自带的播放器、曲目与 mixed 配置，未移植旧播放器逻辑。上游演示文章移至 `docs/theme-examples/` 供查阅，不发布到个人文章列表。

## 本地运行

使用 Node.js 22.12+（本次验证使用 24.13.1）及项目指定的 pnpm 11.28.2。

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd dev
pnpm.cmd check
pnpm.cmd type-check
pnpm.cmd check:manifest
pnpm.cmd check:package-manifest
pnpm.cmd build
$env:MIGRATION_BASE_URL = 'http://127.0.0.1:4322'
pnpm.cmd exec playwright test -c playwright.migration.config.ts tests/site/migration.spec.ts
```

生产输出为 `dist/`；部署工作流保留 `my-original → pages`，安装改为冻结锁文件，并使用 Node.js 24。迁移仅在本地完成，没有推送仓库或触发线上部署。

## 恢复与核验

迁移前分支为 `backup/pre-shirone-20261019`。需要恢复时，先保存后续修改，再切换该分支并按旧锁文件重新安装、构建。完整 Git bundle、原源码与旧构建保存在本次 Codex 工作区的 `work/mizuki-before-shirone*` 中；bundle 已通过完整性验证。旧上游远程保留为 `mizuki-upstream`，新 `upstream` 指向 Shirone，`origin` 保持个人仓库。

`inventory.json` 记录转换数量，`preservation-audit.json` 记录原文件逐项 SHA-256，`font-verification.json` 记录字体转换核验。

主题整体的 Biome 检查存在上游既有问题：干净上游有 459 个错误，迁移版首次全量扫描有 439 个错误；本次修改的 TypeScript 配置与数据文件单独通过检查。没有为消除旧格式问题批量重写整个主题。类型检查脚本明确豁免 Astro 生成集合类型的 4 个上游已记录诊断，其余类型错误必须为零。

## 来源与归属

- Shirone：https://github.com/LyraVoid/Shirone ，MIT；根 `LICENSE` 保留上游文本。
- Mizuki：https://github.com/2258009564/mizuki ，原许可证保存在 `legacy/LICENSE.Mizuki`，迁移的 Live2D 代码与资源保留原版权头。
- `public/pio/static/pio.css` 保留 Pio / Dreamer-Paul 原版权与许可说明；模型、Cubism 运行时保留原资源文件中的归属及使用条款。

本目录的旧代码用于保全与追溯，不属于新主题的构建入口。
