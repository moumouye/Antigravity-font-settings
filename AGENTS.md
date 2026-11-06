# 协同维护与工程行为规范 (Engineering Operational Guide)

本文件定义系统架构调阅指针、质量验收门禁、代码活体映射锁与版本控制规范。

---

## 1. 架构指针与质量验收门禁 (Architecture Pointer & Verification Gate)

为保证工程长期演化中系统稳定不退化，所有代码修改必须严格遵守以下物理铁律：

1. **动手前必读指针**：任何涉及排版样式、界面交互、CDP 桥接通信或管理脚本的改动前，**必须首先查阅 [`ARCHITECTURE.md`](ARCHITECTURE.md) 的意图路由表**，并按需调阅 [`docs/`](docs/) 下的对应真理库；
2. **交付前智能体自主门禁 (Zero-User-Testing Mandate)**：在向用户交付成果前，智能体**必须在本地终端自主运行并全绿通过自动化测试**（参考 [`docs/verification.md`](docs/verification.md)）：
   ```bash
   uv run manage.py test
   ```
   * 退出码必须严格为 `0`；
   * 严禁要求用户手动执行测试或代替智能体核对代码正确性；
   * 若门禁报错，智能体必须根据 STDERR 堆栈在本地自主排查与自愈，直至全绿通过。
3. **缺陷锁死铁律 (Bug-to-Test Invariant)**：
   * 凡涉及 Bug 修复，提交中必须同时包含修复代码与**对应的反向防倒退测试用例**（在修复前必然报错、修复后稳定通过）；
   * 同步在 [`docs/anti-patterns.md`](docs/anti-patterns.md) 中建档记录缺陷编号与技术根因，彻底杜绝历史缺陷二次逃逸。
4. **单一真理维护原则 (Single Source of Truth & Overwrite)**：
   * 若涉及架构调整或契约演化，必须在代码修改的同时，**直接“覆盖更新”[`docs/`](docs/) 与 [`ARCHITECTURE.md`](ARCHITECTURE.md) 的对应章节**；
   * 架构文档中严禁堆砌时间线流水账或历史讨论，确保文档仅反映系统当前的真实实现。
5. **门禁全绿后自主提交**：门禁全绿（退出码 0）后，仅 `git add` 本次变更的特定文件（严禁 `git add -A`），严格按【提交与决策档案规范】执行 `git commit`；严禁私自 push、amend 或绕过 hook；涉及版本号变动时须与代码同次提交。

---

## 2. 代码与领域规范强绑定映射 (Code-to-Doc Living Locks)

为杜绝文档腐化，凡改动以下源码核心逻辑，**必须在同一次提交中同步覆盖写对应的领域规范文档**，测试断言与文档必须保持 100% 一致性：

| 变更源码路径 | 核心业务领域 | 必须同步更新的规范文档 | 核心关注点与不变量 |
| :--- | :--- | :--- | :--- |
| [`sidecars/engine/client/styles.css`](sidecars/engine/client/styles.css) | 排版样式与 CSS 变量 | [`docs/boundaries.md`](docs/boundaries.md)<br>[`docs/contracts.md`](docs/contracts.md) | 弹窗隔离选择器、单反斜杠转义、代码与正文 1:1 绑定 |
| [`sidecars/engine/client/panel.js`](sidecars/engine/client/panel.js) | 设置面板 DOM 与滑块交互 | [`docs/contracts.md`](docs/contracts.md)<br>[`sidecars/engine/client/types.d.ts`](sidecars/engine/client/types.d.ts) | 偏好类型声明、双语字典同步、`__agyFontSavePrefs` 触发 |
| [`sidecars/engine/main.mjs`](sidecars/engine/main.mjs) | Sidecar 引擎与 CDP 桥接 | [`docs/contracts.md`](docs/contracts.md)<br>[`docs/anti-patterns.md`](docs/anti-patterns.md) | CDP 端口探测、断线重载自愈、3 秒免重启热重载、零 npm 依赖 |
| [`manage.py`](manage.py) | 插件生命周期与安装卸载 | [`docs/boundaries.md`](docs/boundaries.md) | 零 pip 依赖、五步彻底卸载闭环清理、状态查询 |
| [`sidecars/engine/test_e2e.mjs`](sidecars/engine/test_e2e.mjs) | 端到端质量门禁套件 | [`docs/verification.md`](docs/verification.md) | 规则解析数基线 ($\ge 36$)、`getComputedStyle` 像素级断言 |

---

## 3. 提交与决策档案规范 (Conventional Commits + Emoji)

提交信息采用“简短结果标题 + 决策档案正文（Why > What）”格式：

```text
<emoji> <type>(<scope>): <简要总结改动结果>

- **Why**: 解释做出该改动的背景、根本原因或业务动机。
- **How**: 简述核心实现方案与改动关键点。
- **Caveats**: 记录放弃的备选废案、已知边界或后续维护注意事项。
```

| Emoji | Type | 说明 |
| :---: | :--- | :--- |
| ✨ | `feat` | 新增功能特性 |
| 🐛 | `fix` | 修复缺陷或样式 Bug（强制伴随反向测试锁） |
| 💄 | `style` | 界面排版、滑块微调与视觉优化 |
| 📝 | `docs` | 文档更新 |
| ♻️ | `refactor` | 代码重构（不改变外部行为） |
| ⚡ | `perf` | 性能提升与响应优化 |
| 🧪 | `test` | 自动化测试构建与用例维护 |
| 🔧 | `chore` | 构建、配置或辅助脚本变动 |
| 🚀 | `release` | 里程碑版本发布与打标 |

---

## 4. 语义化版本 (SemVer) 与 CHANGELOG 维护流程

### 4.1 语义化版本规范 (SemVer)

版本号格式为：`X.Y.Z`（`MAJOR.MINOR.PATCH`）。

| 版本位 | 递增条件 | 示例 |
| :---: | :--- | :--- |
| **MAJOR** (X) | 存在不兼容的核心架构重构或宿主破坏性变动 | `1.0.0` → `2.0.0` |
| **MINOR** (Y) | 向下兼容的功能性新增（如新控制项、新特性） | `1.0.0` → `1.1.0` |
| **PATCH** (Z) | 向下兼容的缺陷修复（如样式溢出、选择器校准） | `1.0.0` → `1.0.1` |

版本号升级时，同步更新：`plugin.json`、`CHANGELOG.md` 及 Git 里程碑打标（`git tag vX.Y.Z`）。

### 4.2 变更日志维护 (CHANGELOG)

变更记录统一维护在根目录 [`CHANGELOG.md`](CHANGELOG.md) 中，采用扁平化无序列表配合 Emoji 前缀记录。

每个版本章节内的无序列表**按以下类型优先级自上而下严格归类排序，严禁不同类型交替穿插**：
1. ✨ `feat`：新增功能特性（优先排在最前）
2. 🐛 `fix`：缺陷与异常修复（紧随其后）
3. 💄 `style`：界面排版、视觉规范与样式微调
4. 🛡️ `scope` / 🌐 `i18n`：样式作用域隔离与多语言规范
5. ♻️ `refactor`：工程架构解耦与类型约束
6. ⚡ `perf`：性能提升与加载优化
7. 🧪 `test` / 🔧 `chore`：自动化测试、构建与管理脚本
8. 📝 `docs`：文档更新
