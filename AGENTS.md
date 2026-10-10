# 项目版本控制与提交规范

本规范用于统一项目的语义化版本演进、Git 提交格式与 CHANGELOG 维护流程。

---

## 1. 语义化版本规范 (SemVer)

版本号格式为：`X.Y.Z`（`MAJOR.MINOR.PATCH`）。

| 版本位 | 递增条件 | 示例 |
| :---: | :--- | :--- |
| **MAJOR** (X) | 存在不兼容的核心架构重构或宿主破坏性变动 | `1.0.0` → `2.0.0` |
| **MINOR** (Y) | 向下兼容的功能性新增（如新控制项、新特性） | `1.0.0` → `1.1.0` |
| **PATCH** (Z) | 向下兼容的缺陷修复（如样式溢出、选择器校准） | `1.0.0` → `1.0.1` |

### 版本号同步清单
版本号升级时，同步更新以下位置：
1. `plugin.json` 中的 `"version"` 字段；
2. `CHANGELOG.md` 中对应的发布章节；
3. Git 里程碑打标（`git tag vX.Y.Z`）。

---

## 2. 提交规范 (Conventional Commits + Emoji)

提交信息格式：

```text
<emoji> <type>(<scope>): <description>
```

| Emoji | Type | 说明 |
| :---: | :--- | :--- |
| ✨ | `feat` | 新增功能特性 |
| 🐛 | `fix` | 修复缺陷或样式 Bug |
| 💄 | `style` | 界面排版、滑块微调与视觉优化 |
| 📝 | `docs` | 文档更新 |
| ♻️ | `refactor` | 代码重构（不改变外部行为） |
| ⚡ | `perf` | 性能提升 |
| 🔧 | `chore` | 构建、配置或辅助脚本变动 |
| 🚀 | `release` | 里程碑版本发布与打标 |

---

## 3. 变更日志维护 (CHANGELOG)

变更记录统一维护在根目录 [`CHANGELOG.md`](CHANGELOG.md) 中，采用扁平化无序列表配合 Emoji 前缀记录，避免多层标题嵌套。

### 日常迭代与发版流程
1. **日常 Commit**：仅记录微观代码快照，**不升级版本号**；重要改动追加至 `CHANGELOG.md` 顶部的 `## [Unreleased]` 无序列表中。
2. **里程碑发版**：
   - 汇集 `[Unreleased]` 条目；
   - 评估并确定新版本号 `vX.Y.Z`；
   - 将 `[Unreleased]` 重命名为 `## [X.Y.Z] - YYYY-MM-DD`；
   - 同步更新 `plugin.json` 并打上 Git Tag。
