# Antigravity Font Settings

自定义 Antigravity 2.0 桌面客户端字体大小与排版的轻量级扩展。

无需解包或修改 `app.asar`，利用 Antigravity 原生 Sidecar 机制与 DevTools 调试通道（CDP），无侵入实现左右两侧独立排版调节与持久化存储。

---

## 核心特性

- **左右独立缩放**：左侧侧边栏（项目树、会话历史）与右侧主工作区（对话正文、输入框、代码块）字号完全独立可调。
- **细粒度排版控制**：
  - 侧边栏字号（10px ~ 24px，默认 14px）
  - 对话正文字号（11px ~ 36px，默认 15px）
  - 代码块字号（10px ~ 28px，默认 13px）
  - 正文行高比例（1.0 ~ 2.6，默认 1.6）
  - 自定义界面字体族（UI Font Family）与代码等宽字体族（Code Font Family）
- **开放自由输入**：除平滑滑块外，数值输入框允许直接手输任意目标数值。
- **原生弹窗无缝集成**：在官方设置弹窗（`⚙️ Settings`）左侧菜单中无缝挂载「Font Settings」标签页，体验与原生功能浑然一体。
- **即时响应与持久化**：调节毫秒级即时生效，配置持久化保存，重启应用不丢失。

---

## 安装与使用

### 1. 启动管理器或安装插件
在项目目录下直接运行：
```bash
uv run manage.py
```
终端将自动弹出交互式数字菜单，按提示输入 `1` 即可一键完成安装与启用；也可以直接通过命令行参数执行：
```bash
uv run manage.py install
```

### 2. 重启 Antigravity
完全退出并重新打开 Antigravity 客户端。

### 3. 打开设置调节
1. 点击主界面左下角的 **`⚙️ Settings`** 按钮（或按快捷键 `Cmd+,`）。
2. 在左侧菜单中点击 **「Font Settings」**。
3. 拖动滑块或输入数值，左右两侧界面字体即时发生变化。

---

## 管理命令

直接运行 `uv run manage.py` 进入数字控制台，或通过参数直接执行：

| 操作 | 命令 | 说明 |
| :--- | :--- | :--- |
| **交互控制台** | `uv run manage.py` | 启动极简交互菜单，按数字键 [0-5] 选取操作 |
| 查看状态 | `uv run manage.py status` | 查看插件安装、字号配置数据与后台引擎状态 |
| 安装启用 | `uv run manage.py install` | 建立软链接并在配置中启用 |
| 启用插件 | `uv run manage.py enable` | 激活插件并自动继承已保存的历史字体配置 |
| 禁用插件 | `uv run manage.py disable` | 暂时停用插件并释放进程，完整保留字体配置 |
| 彻底卸载 | `uv run manage.py uninstall` | 纯净卸载，清理软链接、配置条目与数据缓存（零残留） |

---

## 项目结构

```text
Antigravity-font-settings/
├── plugin.json              # Antigravity 插件清单
├── manage.py                # 跨平台一键安装/管理工具（零外部依赖）
├── assets/
│   └── logo.svg             # 插件图标
├── sidecars/
│   └── engine/
│       ├── sidecar.json     # 后台服务清单
│       ├── main.mjs         # CDP 自动化发现与注入服务
│       └── inject.js        # 前端动态样式与设置弹窗组件
└── README.md
```
