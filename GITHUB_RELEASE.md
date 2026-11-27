# Antigravity Font Settings v1.2.0 发版说明

### 核心更新与说明

- **跨平台共享无侵入 CDP 引导**：适配新版 Antigravity 默认关闭 CDP 的机制，新增共享引导模块 `compat/cdp_bootstrap.py`（与 Antigrative Dashboard、Timeline Navigator 共享同一公共底座与引用计数卸载，严禁篡改原应用或 `app.asar`）：
  - **macOS**：自动配置登录自启项（`com.moumouye.antigravity-cdp`）与 `/Applications/Antigravity Launcher.app`；
  - **Windows**：自动为桌面、开始菜单与任务栏快捷方式注入 `--remote-debugging-port=0 --remote-debugging-address=127.0.0.1` 并支持卸载还原。
- **跨平台一键安装与彻底卸载**：提供 macOS/Linux（`install.sh` / `uninstall.sh`）与 Windows PowerShell（`install.ps1` / `uninstall.ps1`）一行在线安装与纯净卸载脚本，并新增 `manage.py setup-cdp` 快捷修复命令。
- **Windows 端口发现修复与控制台编码兼容**：修复此前仅检索 `%LOCALAPPDATA%\Antigravity` 导致遗漏 `%APPDATA%\Antigravity\DevToolsActivePort` 的问题，并兼容 Windows 非 UTF-8（`cp1252`）终端输出。
- **排版功能与体验升级**：
  - 统一代码字号与对话正文 1:1 联动（`--agy-font-code: var(--agy-font-main)`），移除冗余自定义字体族，保持跨平台一致性；
  - 新增「滑块背景透明穿透模式（Ghost Peeking Mode）」，拖动滑块时透明穿透背景，实时直视底层排版变化；
  - 修复窗口重载/升级后注入丢失问题、CSS 双反斜杠转义问题与数字输入框遮挡问题，并完成 `client/` 源码模块化与 TypeScript 类型校验（`// @ts-check`）。

---

*详细更新历史请参阅 [CHANGELOG.md](CHANGELOG.md)。*
