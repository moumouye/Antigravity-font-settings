# 系统架构与实现原理 (System Architecture)

本项目为 Antigravity 桌面客户端提供非侵入式的细粒度字体与排版定制能力。无需解包客户端二进制或修改 `app.asar`，利用 Antigravity 原生 Sidecar 运行机制与 Chrome DevTools Protocol (CDP) 调试桥接，实现排版样式的即时动态注入、毫秒级响应、双向数据持久化与免重启热重载。

---

## 1. 系统总体架构 (System Architecture)

整个系统由 **宿主层 (Host)**、**引擎层 (Sidecar Engine)**、**注入层 (Page Renderer)** 与 **数据持久化层 (Storage)** 四部分组成：

```mermaid
flowchart TB
    subgraph Host ["🖥️ Antigravity 宿主层 (Electron)"]
        DevTools["DevTools 活跃调试端口<br/>(DevToolsActivePort)"]
        Renderer["主渲染进程窗口<br/>(Workbench Renderer)"]
    end

    subgraph Sidecar ["⚙️ 引擎服务层 (Sidecar Engine)"]
        Main["main.mjs 守护进程<br/>(无依赖动态装配器)"]
        CDP["CDP Client (WebSocket)"]
        Watcher["源码变动轮询感知器 (3s Tick)"]
    end

    subgraph Client ["🎨 渲染注入层源码 (sidecars/engine/client/)"]
        Types["types.d.ts (TS 类型约束)"]
        Styles["styles.css (纯样式表)"]
        I18n["i18n.js (双语字典)"]
        Panel["panel.js (DOM 与交互)"]
    end

    subgraph Injected ["🎨 渲染注入层 (Page Context)"]
        Observer["DOM 变动监听器 (MutationObserver)"]
        SettingsTab["Font Settings 设置面板"]
        StyleTag["动态样式表 & CSS 变量"]
        Binding["__agyFontSavePrefs() RPC 绑定"]
    end

    subgraph Storage ["💾 数据持久化层"]
        Prefs["preferences.json<br/>(用户字号/字体族偏好)"]
    end

    Main -->|探测调试端口| DevTools
    Main -->|建立 WebSocket 会话| CDP
    CDP <==>|双向通信通道| Renderer

    Watcher -->|监听模块文件变动| Client
    Client -->|内存动态装配| Main
    Main -->|运行时 CDP 动态评估注入| CDP

    Renderer --> Observer
    Observer --> SettingsTab
    SettingsTab --> StyleTag
    SettingsTab -->|滑动触发保存| Binding
    Binding -->|CDP 事件回传| Main
    Main -->|原子写入| Prefs
    Prefs -.->|启动时回填| Main
```

---

## 2. 核心交互与持久化时序 (Lifecycle & Persistence Sequence)

用户在设置面板中调整字体时，样式修改与本地落盘采用“界面零延迟响应 + 后台异步持久化”的双轨设计：

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 用户
    participant UI as 🎨 设置面板 (inject.js)
    participant DOM as 🖥️ 主界面 DOM
    participant Node as ⚙️ Sidecar 引擎 (main.mjs)
    participant Disk as 💾 本地磁盘 (preferences.json)

    Note over Node, Disk: 引擎初始化阶段
    Node->>Disk: 读取已保存的偏好设置 (loadPrefs)
    Disk-->>Node: 返回历史字号 (正文 19px, 侧栏 16px...)
    Node->>UI: 将历史字号注入 window.localStorage

    Note over User, DOM: 用户调节字号阶段
    User->>UI: 拖动字号滑块 (如: 正文 15px -> 18px)
    UI->>DOM: 立即更新 CSS 变量 (--agy-main-font-size)
    DOM-->>User: 界面字体毫秒级即时放大渲染

    Note over UI, Disk: 异步持久化落盘阶段
    UI->>Node: 触发 CDP 绑定 __agyFontSavePrefs(json)
    Node->>Disk: 原子写入 preferences.json
    Node-->>Node: 记录日志: [Font Engine] Saved preferences
```

---

## 3. 免重启热重载机制 (Hot-Reloading Sequence)

当开发者修改了 `client/` 下的样式（`styles.css`）、文案（`i18n.js`）或交互逻辑（`panel.js`），或用户通过版本管理拉取了最新代码时，系统通过 CDP 自动执行热重载，无需关闭或重启 Antigravity 宿主：

```mermaid
sequenceDiagram
    autonumber
    actor Dev as 👨‍💻 代码更新 / Git Pull
    participant File as 📄 client/ 源码模块
    participant Engine as ⚙️ main.mjs (装配轮询器)
    participant CDP as 🔌 CDP 通道 (WebSocket)
    participant Page as 🖥️ 运行中的 Antigravity 窗口

    Dev->>File: 写入新排版逻辑 / 更新样式或文案
    loop 每 3 秒定期检测
        Engine->>File: 读取模块内容并计算装配哈希 (tick)
    end
    File-->>Engine: 感知到源码模块内容发生变更
    Engine->>Engine: 内存中动态装配合成新版脚本闭包
    Engine->>CDP: Runtime.evaluate (注入最新脚本源码)
    CDP->>Page: 页面上下文执行新版脚本
    Page-->>Page: 自动卸载旧 DOM 结构，重绘新版「Font Settings」面板
    Note over Dev, Page: ✅ 全程无需关闭或重启客户端，新功能与新样式即时生效
```

---

## 4. 关键设计原则与隔离规范

1. **非侵入原则**：完全依赖官方 Sidecar 规范与 CDP 调试协议，不修改 Electron 安装目录的任何系统文件或 ASAR 归档。
2. **样式作用域隔离**：
   - 侧边栏字号仅作用于主界面工作区（项目树、会话列表）；
   - 设置弹窗自身的侧栏字体严格锁定为原生 `14px`，确保打开设置窗口时布局始终稳定，防止递归变形；
   - 用户发送消息气泡与 AI 响应气泡建立统一样式选择器同步约束。
3. **环境无关性与零依赖**：
   - 管理脚本 [`manage.py`](manage.py) 完全基于 Python 3 标准库，无需通过 pip 安装第三方依赖；
   - 彻底卸载时执行 5 步清理，同步清除插件软链接、`config.json` 注册表、`sidecar_data` 缓存及 `plugin_data` 残留目录，确保系统零残留。
