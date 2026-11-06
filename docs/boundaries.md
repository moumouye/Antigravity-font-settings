# ① 边界与红线 (Boundaries & Constraints)

本文档定义本项目的系统架构边界、模块职责分工与不可逾越的物理红线。

---

## 1. 核心架构红线 (Non-negotiable Constraints)

系统开发与维护必须严格遵守以下物理红线，严禁破坏：

1. **宿主非侵入隔离红线 (Host Non-Invasive Invariant)**：
   * 仅依托 Antigravity 原生 Sidecar 运行机制与 Chrome DevTools Protocol (CDP) 调试桥接实现页面注入与双向通信；
   * 严禁修改 Electron 应用程序二进制、解包修改 `app.asar` 或修改宿主安装目录下的任何系统级文件；
   * 插件卸载或禁用后，宿主外观与功能必须完全回归官方原始状态。

2. **零外部依赖与零安装红线 (Zero External Dependencies)**：
   * **管理端 (CLI)**：[`manage.py`](file:///Users/yemou/Documents/extentions/Antigravity-font-settings/manage.py) 必须严格基于 Python 3 标准库，严禁引入第三方 `pip` 依赖；
   * **引擎端 (Sidecar)**：[`sidecars/engine/main.mjs`](file:///Users/yemou/Documents/extentions/Antigravity-font-settings/sidecars/engine/main.mjs) 与测试套件必须严格基于 Node.js 原生标准库（`node:fs/promises`、`node:path`、内置 `fetch` 与内置 `WebSocket`），严禁生成 `node_modules` 目录或依赖外部 npm 包；
   * **渲染注入端 (Client)**：[`sidecars/engine/client/`](file:///Users/yemou/Documents/extentions/Antigravity-font-settings/sidecars/engine/client/) 采用纯原生 JavaScript / CSS 与 `types.d.ts`（配合 `// @ts-check`），在无打包构建工具链的前提下达成类型安全。

3. **样式作用域物理隔离红线 (CSS Scoping Invariants)**：
   * **排除模态弹窗与外部 UI**：所有正文、代码、折叠思考与 Markdown 标题/表格的字号规则，必须携带 `:not([role="dialog"] *):not(.settings-modal-container *)` 作用域保护，严禁样式规则向设置弹窗、快捷键面板或通知浮层外溢；
   * **设置弹窗侧栏字体锁定**：设置弹窗自身的侧栏字体必须严格锁定为原生 `14px`，严禁随工作区侧栏字号联动变形；
   * **单一挂载节点**：动态样式标签必须永久绑定唯一 DOM 节点 `#agy-font-settings-style`，禁止动态创建散乱的 `<style>` 标签。

4. **数据与持久化沙箱红线 (Storage Sandbox Invariant)**：
   * 用户字号偏好数据严格限定存储在宿主沙箱目录：`~/.gemini/antigravity/sidecar_data/antigravity-font-settings/engine/data/preferences.json`；
   * 卸载时必须执行联动清理（软链接解除、`config.json` 注册表移除、`sidecar_data` 递归清除、`plugin_data` 残留目录删除及后台 Sidecar 进程终止），确保宿主环境零残留。

---

## 2. 模块职责与技术栈边界 (Module Responsibilities)

| 模块层级 | 物理位置 | 技术栈 | 职责边界（只准做什么，严禁做什么） |
| :--- | :--- | :--- | :--- |
| **CLI 管理端** | [`manage.py`](file:///Users/yemou/Documents/extentions/Antigravity-font-settings/manage.py) | Python 3 (标准库) | **允许**：插件软链接安装/卸载、`config.json` 状态切换、后台进程检索与终止、运行状态汇总、调用自动化测试。<br>**严禁**：直接干预渲染窗口 DOM 或执行排版逻辑。 |
| **Sidecar 引擎服务** | [`sidecars/engine/main.mjs`](file:///Users/yemou/Documents/extentions/Antigravity-font-settings/sidecars/engine/main.mjs) | Node.js (ESM 原生) | **允许**：嗅探 CDP 调试端口、维护 WebSocket 连接、内存动态装配 Client 模块、3秒轮询免重启热重载、持久化 `preferences.json`。<br>**严禁**：引入 npm 依赖、直接操作外部系统文件。 |
| **渲染注入层 (源码)** | [`sidecars/engine/client/`](file:///Users/yemou/Documents/extentions/Antigravity-font-settings/sidecars/engine/client/) | CSS3 / ES2022 / TS 类型声明 | **允许**：定义原生样式规则、双语字典维护、DOM 节点挂载、滑块拖拽事件监听、Ghost Peeking 视效、触发 `__agyFontSavePrefs` RPC。<br>**严禁**：调用本地磁盘 I/O、使用非标准的第三方框架。 |
| **端到端门禁测试套件** | [`sidecars/engine/test_e2e.mjs`](file:///Users/yemou/Documents/extentions/Antigravity-font-settings/sidecars/engine/test_e2e.mjs) | Node.js (ESM 原生) | **允许**：读取 CDP 端口、注入组装模块、断言 CSS 规则数、断言 `getComputedStyle` 像素级真实渲染、重置用户偏好。<br>**严禁**：使用纯 Mock 绕过真实 CDP 窗口验证。 |
