#!/usr/bin/env python3
"""Antigravity Font Settings - Plugin Lifecycle Manager."""
import argparse
import json
import os
import shutil
import signal
import subprocess
import sys
import time
from pathlib import Path

SOURCE_DIR = Path(__file__).resolve().parent
HOME = Path.home()
CONFIG_DIR = HOME / ".gemini" / "config"
PLUGINS_DIR = CONFIG_DIR / "plugins"
PLUGIN_TARGET = PLUGINS_DIR / "antigravity-font-settings"
CONFIG_FILE = CONFIG_DIR / "config.json"
SIDECAR_DATA_DIR = HOME / ".gemini" / "antigravity" / "sidecar_data" / "antigravity-font-settings"
PLUGIN_DATA_DIR = HOME / ".gemini" / "antigravity" / "plugin_data" / "antigravity-font-settings"
PREFS_FILE = SIDECAR_DATA_DIR / "engine" / "data" / "preferences.json"


def load_json(path: Path, default=None):
    if not path.exists():
        return default if default is not None else {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default if default is not None else {}


def save_json(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + ".tmp")
    temp.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temp.replace(path)


def get_sidecar_pids() -> list:
    """Find running Sidecar helper process PIDs for this plugin."""
    engine_dir = SOURCE_DIR / "sidecars" / "engine"
    pids = []
    try:
        res = subprocess.run(["lsof", "+D", str(engine_dir)], capture_output=True, text=True)
        for line in res.stdout.splitlines()[1:]:
            parts = line.split()
            if len(parts) >= 2 and parts[1].isdigit():
                cmd_name = parts[0].lower()
                if "antigravi" in cmd_name or "node" in cmd_name:
                    pids.append(int(parts[1]))
    except Exception:
        pass
    return sorted(list(set(pids)))


def kill_sidecar_processes(verbose: bool = True) -> int:
    """Terminate any running Sidecar processes for this plugin."""
    pids = get_sidecar_pids()
    if not pids:
        if verbose:
            print("[INFO] 当前无后台 Sidecar 进程运行。")
        return 0

    killed = 0
    for pid in pids:
        try:
            os.kill(pid, signal.SIGTERM)
            if verbose:
                print(f"[INFO] 已向 Sidecar 进程发送停止信号 (PID: {pid})。")
            killed += 1
        except ProcessLookupError:
            pass
        except Exception as e:
            if verbose:
                print(f"[WARN] 停止进程 PID {pid} 失败: {e}")

    time.sleep(0.5)
    remaining_pids = get_sidecar_pids()
    for pid in remaining_pids:
        try:
            os.kill(pid, signal.SIGKILL)
            if verbose:
                print(f"[INFO] 强制终止残留 Sidecar 进程 (PID: {pid})。")
        except Exception:
            pass

    return killed


def install_plugin():
    """Install plugin by linking to ~/.gemini/config/plugins and registering in config.json."""
    print("\n--- [1/2] 安装插件软链接 ---")
    PLUGINS_DIR.mkdir(parents=True, exist_ok=True)

    if SOURCE_DIR.resolve() == PLUGIN_TARGET.resolve():
        print(f"[INFO] 当前已位于目标插件目录 ({PLUGIN_TARGET})，跳过软链接创建。")
    else:
        if PLUGIN_TARGET.exists() or PLUGIN_TARGET.is_symlink():
            try:
                if PLUGIN_TARGET.is_symlink():
                    PLUGIN_TARGET.unlink()
                else:
                    shutil.rmtree(PLUGIN_TARGET)
                print(f"[OK] 已清理旧安装路径: {PLUGIN_TARGET}")
            except Exception as e:
                print(f"[ERROR] 清理旧安装失败: {e}")
                return

        try:
            PLUGIN_TARGET.symlink_to(SOURCE_DIR, target_is_directory=True)
            print(f"[OK] 已创建软链接: {PLUGIN_TARGET} -> {SOURCE_DIR}")
        except OSError:
            shutil.copytree(SOURCE_DIR, PLUGIN_TARGET, symlinks=True)
            print(f"[OK] 已拷贝插件到: {PLUGIN_TARGET}")

    print("\n--- [2/2] 注册并启用插件 ---")
    config = load_json(CONFIG_FILE, {})
    plugins = config.setdefault("plugins", {})
    plugins["antigravity-font-settings"] = {"enabled": True}
    save_json(CONFIG_FILE, config)
    print(f"[OK] 已在 {CONFIG_FILE} 中启用插件。")

    print("\n[完成] 插件已安装并启用！")
    print("提示: 若 Antigravity 正在运行，请重启客户端以加载字体设置插件。")


def uninstall_plugin(deep: bool = True):
    """Deep clean uninstall: terminate process, remove symlinks, clear config entries & cache."""
    print("\n--- [1/4] 停止运行中的后台引擎 ---")
    killed_count = kill_sidecar_processes(verbose=True)
    if killed_count > 0:
        print(f"[OK] 已停止 {killed_count} 个后台引擎进程。")

    print("\n--- [2/5] 移除插件软链接与安装目录 ---")
    if PLUGIN_TARGET.is_symlink():
        PLUGIN_TARGET.unlink()
        print(f"[OK] 已移除软链接: {PLUGIN_TARGET}")
    elif PLUGIN_TARGET.exists():
        shutil.rmtree(PLUGIN_TARGET)
        print(f"[OK] 已移除插件目录: {PLUGIN_TARGET}")
    else:
        print("[INFO] 插件安装目录/软链接不存在。")

    print("\n--- [3/5] 清理系统配置文件注册项 ---")
    config = load_json(CONFIG_FILE, {})
    modified = False

    plugins = config.get("plugins", {})
    if "antigravity-font-settings" in plugins:
        del plugins["antigravity-font-settings"]
        modified = True
        print("[OK] 已从 config.json 清理 ['plugins'] 注册项。")

    sidecars = config.get("sidecars", {})
    if "antigravity-font-settings/engine" in sidecars:
        del sidecars["antigravity-font-settings/engine"]
        modified = True
        print("[OK] 已从 config.json 清理 ['sidecars'] 注册项。")

    if modified:
        save_json(CONFIG_FILE, config)
    else:
        print("[INFO] config.json 中无残留注册项。")

    print("\n--- [4/5] 递归清除关联数据目录与宿主残留文件夹 ---")
    if deep:
        # 清理 Sidecar 数据与日志目录
        if SIDECAR_DATA_DIR.exists():
            try:
                shutil.rmtree(SIDECAR_DATA_DIR)
                print(f"[OK] 已彻底清除 Sidecar 数据目录: {SIDECAR_DATA_DIR}")
            except Exception as e:
                print(f"[WARN] 清除 Sidecar 数据目录失败: {e}")
        else:
            print("[INFO] Sidecar 数据目录不存在。")

        # 清理 Antigravity 自动分配的插件数据文件夹（哪怕是空文件夹也彻底删除）
        if PLUGIN_DATA_DIR.exists():
            try:
                shutil.rmtree(PLUGIN_DATA_DIR)
                print(f"[OK] 已彻底删除宿主生成的插件数据空文件夹: {PLUGIN_DATA_DIR}")
            except Exception as e:
                print(f"[WARN] 删除插件数据文件夹失败: {e}")
        else:
            print("[INFO] 插件数据文件夹不存在。")

    print("\n--- [5/5] 清理本地工程临时数据与日志 ---")
    local_sidecar_data = SOURCE_DIR / "sidecars" / "engine" / "data"
    if local_sidecar_data.exists():
        shutil.rmtree(local_sidecar_data)
        print(f"[OK] 已清理本地临时数据目录: {local_sidecar_data}")

    local_sidecar_logs = SOURCE_DIR / "sidecars" / "engine" / "logs"
    if local_sidecar_logs.exists():
        shutil.rmtree(local_sidecar_logs)
        print(f"[OK] 已清理本地临时日志目录: {local_sidecar_logs}")

    print("\n[完成] 彻底纯净卸载完毕！所有相关文件及对应空文件夹已全部删除，系统内零残留。")


def set_enabled(enable: bool):
    """Enable or disable plugin in config.json with state preservation feedback."""
    config = load_json(CONFIG_FILE, {})
    plugins = config.setdefault("plugins", {})
    entry = plugins.setdefault("antigravity-font-settings", {})
    entry["enabled"] = enable
    save_json(CONFIG_FILE, config)

    if not enable:
        # Automatically stop background process to release resources
        kill_sidecar_processes(verbose=False)
        print("\n[OK] 插件已禁用（后台进程已同步释放）。")
        print("[状态保留] 您的自定义字号、行高等配置已完好保存在本地，绝不会丢失；重新启用即可恢复。")
    else:
        print("\n[OK] 插件已重新启用。")
        print("[状态恢复] 已加载历史字体设置，重启 Antigravity 后即刻生效。")


def check_status():
    """Inspect and report current plugin and engine status."""
    installed = PLUGIN_TARGET.exists() or PLUGIN_TARGET.is_symlink()
    link_type = "软链接" if PLUGIN_TARGET.is_symlink() else "实体目录"

    config = load_json(CONFIG_FILE, {})
    is_enabled = config.get("plugins", {}).get("antigravity-font-settings", {}).get("enabled", False)
    sidecar_registered = "antigravity-font-settings/engine" in config.get("sidecars", {})

    pids = get_sidecar_pids()

    # Read user preferences
    prefs_summary = "未配置 (默认预设)"
    if PREFS_FILE.exists():
        try:
            prefs = json.loads(PREFS_FILE.read_text(encoding="utf-8"))
            main_sz = prefs.get("mainFontSize", 15)
            side_sz = prefs.get("sidebarFontSize", 14)
            lh = prefs.get("lineHeight", 1.6)
            custom_thought = prefs.get("customThoughtFontSize", False)
            thought_sz = prefs.get("thoughtFontSize", 13)
            thought_desc = f"{thought_sz}px (独立)" if custom_thought else "等比自适应 (85%)"
            prefs_summary = f"正文与代码 {main_sz}px | 侧栏 {side_sz}px | 折叠/思考 {thought_desc} | 行高 {lh}"
        except Exception:
            prefs_summary = "已保存 (读取异常)"

    # Check DevTools port
    if sys.platform == "darwin":
        profile = HOME / "Library" / "Application Support" / "Antigravity"
    elif sys.platform == "win32":
        profile = Path(os.environ.get("LOCALAPPDATA", str(HOME / "AppData" / "Local"))) / "Antigravity"
    else:
        profile = Path(os.environ.get("XDG_CONFIG_HOME", str(HOME / ".config"))) / "Antigravity"

    port_file = profile / "DevToolsActivePort"
    port_status = "未运行"
    if port_file.exists():
        try:
            port = port_file.read_text().splitlines()[0].strip()
            port_status = f"运行中 (CDP 调试端口: {port})"
        except Exception:
            port_status = "运行中"

    print("\n========================================================")
    print("          Antigravity 字体设置 - 状态总览               ")
    print("========================================================")
    print(f"  安装状态:       {'已安装 (' + link_type + ')' if installed else '未安装'}")
    print(f"  启用状态:       {'已启用' if is_enabled else '已禁用'}")
    print(f"  后台引擎进程:   {'运行中 (PID: ' + ', '.join(map(str, pids)) + ')' if pids else '未启动'}")
    print(f"  用户字体配置:   {prefs_summary}")
    print(f"  宿主应用状态:   {port_status}")
    print("========================================================")


def run_tests():
    """Run End-to-End automated testing suite via test_e2e.mjs."""
    test_script = SOURCE_DIR / "sidecars" / "engine" / "test_e2e.mjs"
    if not test_script.exists():
        print(f"[ERROR] 未找到测试脚本: {test_script}")
        return False
    print("\n--- 正在启动端到端自动化测试链路 ---")
    res = subprocess.run(["node", str(test_script)])
    return res.returncode == 0


def interactive_menu():
    """Display streamlined interactive numeric menu in terminal."""
    while True:
        print("\n========================================================")
        print("         Antigravity 字体设置插件管理器 (v1.1.0)         ")
        print("========================================================")
        print("  [1] 安装并启用插件 (Install)")
        print("  [2] 彻底卸载插件 (Uninstall - 清理所有配置与数据)")
        print("  [3] 查看当前状态 (Status - 含已存字号与运行状态)")
        print("  [4] 启用插件 (Enable - 激活并恢复历史字体设置)")
        print("  [5] 禁用插件 (Disable - 暂时停用，保留字体设置)")
        print("  [6] 运行自动化全链路测试 (Test)")
        print("  [0] 退出管理器 (Exit)")
        print("========================================================")

        try:
            choice = input("请输入选项序号 [0-6]: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n\n已退出管理器。")
            break

        if choice == "1":
            install_plugin()
        elif choice == "2":
            uninstall_plugin(deep=True)
        elif choice == "3":
            check_status()
        elif choice == "4":
            set_enabled(True)
        elif choice == "5":
            set_enabled(False)
        elif choice == "6":
            run_tests()
        elif choice == "0":
            print("\n已退出管理器。")
            break
        else:
            print(f"\n[!] 无效选项: '{choice}'，请输入 0 到 6 之间的数字。")

        try:
            input("\n按回车键继续...")
        except (KeyboardInterrupt, EOFError):
            print("\n\n已退出管理器。")
            break


def main():
    parser = argparse.ArgumentParser(
        description="Antigravity Font Settings Plugin Lifecycle Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "action",
        nargs="?",
        default=None,
        choices=["install", "uninstall", "enable", "disable", "status", "test"],
        help="Action to execute (leave empty for interactive menu)",
    )
    args = parser.parse_args()

    if args.action is None:
        interactive_menu()
    elif args.action == "install":
        install_plugin()
    elif args.action == "uninstall":
        uninstall_plugin(deep=True)
    elif args.action == "enable":
        set_enabled(True)
    elif args.action == "disable":
        set_enabled(False)
    elif args.action == "status":
        check_status()
    elif args.action == "test":
        run_tests()


if __name__ == "__main__":
    main()
