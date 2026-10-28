# 社区目录提交说明 / Community directory submission

**当前状态：尚未提交到 Obsidian 社区目录。** 本说明供仓库作者手动登录、确认政策和维护承诺后提交；本地预检通过不代表已经获得官方审核或上架。

当前提交版本：**1.3.3**。这是桌面外观插件，不提供聊天或 AI 服务。

## 1. 登录并关联 GitHub

1. 打开 <https://community.obsidian.md>，点击右上角 **Sign in**，用你的 Obsidian 账号登录。
2. 在 **Community profile → GitHub** 点击 **Connect**，关联拥有仓库的 GitHub 账号 **tarnish233**。
3. 由你本人在 GitHub 页面确认授权。官方文档说明，这一步用于通过公开个人资料验证仓库归属。

无需 fork `obsidianmd/obsidian-releases` 或修改 `community-plugins.json`；当前提交流程通过社区目录网站完成。

## 2. 新建插件条目

侧栏选择 **Plugins → New plugin**。

**GitHub repository URL** 可直接复制：

```text
https://github.com/tarnish233/obsidian-quiet-chat
```

**Owner** 选择你本人，除非你确实要将维护权交给某个组织。

其他信息由默认分支的 `manifest.json` 读取：

| 字段 | 值 |
| --- | --- |
| Name | Quiet Chat |
| ID | quiet-chat |
| Author | tarnish233 |
| Version | 1.3.3 |
| Minimum Obsidian version | 1.13.0 |
| Desktop only | true |
| License | MIT |

插件名称和 ID 最终是否可用，以目录提交时的验证结果为准。

由你本人阅读并同意 [Developer policies](https://docs.obsidian.md/community-directory/developer-policies)，确认会继续维护插件，或在无法维护时移除或转交条目，再点击 **Submit**。不要在未阅读、未同意时勾选这些承诺。

## 3. 查看自动审核结果

提交后，条目的管理页会显示 Manifest、Releases、Source code 和 Build verification 的扫描结果。

- **Error**：需要修正后发布新版本；目录存在错误时，用户无法在 Obsidian 内安装。
- **Warning / Recommendation**：官方文档说明警告不会阻止提交，但建议在可行时处理。
- 可通过 **Review branch** 选择 `1.3.3` 并运行预览扫描。
- 发布修正版本后，可以使用 **... → Check for new releases** 或 **Request review** 请求更新检查。

如果有错误，把完整的扫描信息和对应规则发给维护者处理。不要覆盖旧版本的 Release；源代码改动应发布新的版本号和对应的安装包。

## 4. 完善展示信息

选择 **Edit listing**，填写介绍、类别、付款类型和截图。

### Short description

以下介绍与当前 manifest 一致，可直接复制：

```text
A calmer workspace with rounded panes, soft colors, aligned tabs, and optional distraction controls.
```

### Long description

```text
Quiet Chat is a desktop appearance plugin for Obsidian, not a chat or AI integration.

It provides rounded editor panes, light and dark appearances, aligned file icons, configurable document typography, and optional hiding of the ribbon, status bar, and note header. When the note header is hidden, native edit/reading controls and the more-options menu remain available on hover over the note's top-right corner.

The plugin works offline. It does not make network requests, edit notes, collect telemetry, or change Obsidian's core settings or shortcuts. Material Icon Theme integration is optional; no third-party icon assets are bundled.

Requires Obsidian 1.13.0 or newer on desktop. Works best with the Default theme; custom themes and CSS snippets can affect the appearance.
```

### 类别与付款类型

- **Categories**：选择与外观、界面定制或编辑体验相关的类别，以页面实际选项为准。
- **Payment type**：选择 **Free**。插件没有付费功能，也不依赖付费服务。

### Screenshots

可上传以下文件：

- [浅色预览](community-preview-light.png)
- [深色预览](community-preview-dark.png)

两张图片均为 **1200 × 800 PNG**，小于 **5 MB**。内容来自仓库原有的合成示例预览，不包含真实笔记库内容。原始图保持比例缩放并补齐背景，未拉伸或裁掉正文。

当前官方截图要求：最多 5 张桌面图，1200 × 800；最多 5 张移动图，900 × 1600；支持 JPEG、PNG、WebP，单张最大 5 MB。本插件仅支持桌面，无需提供移动截图。

## 5. 发布

保存展示信息，检查自动审核中的 **Error** 已处理，再按目录页面提示选择 **Publish**。

点击 Submit 或 Publish 本身不代表已通过审核或已经可安装。最终结果以条目状态和 Obsidian 内的社区插件目录为准。

## 已完成的本地准备

- 公开 GitHub 仓库、根目录 `README.md`、`LICENSE`、`manifest.json` 已具备。
- MIT 许可证可被 GitHub 识别。
- GitHub Release `1.3.3` 对应 manifest 版本，并附带 `main.js`、`manifest.json`、`styles.css`。
- `npm run check`：TypeScript 编译及 **8 项测试通过**。
- 使用官方 `eslint-plugin-obsidianmd`，按其文档所述的社区扫描器规则严重度对 `src/` 做本地预检：**0 errors，7 warnings**。这不是社区网站的正式扫描，也不包含网站的构建重现验证。
- 已修复运行时创建 `<style>` 标签的问题：静态样式随 `styles.css` 分发，动态参数使用私有 CSS 变量，并在关闭外观或卸载时恢复原有内联值及优先级。
- 设置分组改用原生 `Setting.setHeading()`，移除了顶层插件名称标题。
- 剩余建议主要涉及声明式设置及设置搜索、旧设置刷新/滑块 API、按钮大小写，以及 DOM 创建辅助 API。它们在该本地扫描配置中均为警告，未通过关闭安全规则绕过预检。

## 维护注意事项

Quick Switcher 图标装饰依赖其内部渲染原型，标签图标依赖工作区 DOM，Material Icon Theme 图标来自可选插件的接口。这些并非全部为稳定公共 API，升级 Obsidian 或相关插件后需要回归验证；失效时应保留原生界面并移除本插件的装饰。

每次发布时，保持 `manifest.json`、`package.json`、`package-lock.json` 和 `versions.json` 的版本信息一致，Release 标签必须精确等于 manifest 版本，如 `1.3.3`，而不是 `v1.3.3`。

## 官方参考

- [Submit your plugin](https://docs.obsidian.md/plugins/releasing/submit-plugin)
- [Set up and claim](https://docs.obsidian.md/community-directory/set-up-and-claim)
- [Manage your plugin or theme](https://docs.obsidian.md/community-directory/manage-entry)
- [Developer policies](https://docs.obsidian.md/community-directory/developer-policies)
- [Submission requirements for plugins](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins)
- [Official ESLint plugin and scanner configuration](https://github.com/obsidianmd/eslint-plugin/blob/main/docs/configuration.md)
