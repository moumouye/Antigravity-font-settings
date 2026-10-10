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
            print("[INFO] No running Sidecar process detected.")
        return 0

    killed = 0
    for pid in pids:
        try:
            os.kill(pid, signal.SIGTERM)
            if verbose:
                print(f"[INFO] Sent SIGTERM to Sidecar process (PID: {pid}).")
            killed += 1
        except ProcessLookupError:
            pass
        except Exception as e:
            if verbose:
                print(f"[WARN] Failed to terminate PID {pid}: {e}")

    # Give process 0.5s to exit gracefully, force kill if lingering
    time.sleep(0.5)
    remaining_pids = get_sidecar_pids()
    for pid in remaining_pids:
        try:
            os.kill(pid, signal.SIGKILL)
            if verbose:
                print(f"[INFO] Sent SIGKILL to lingering Sidecar process (PID: {pid}).")
        except Exception:
            pass

    return killed


def install_plugin():
    """Install plugin by linking to ~/.gemini/config/plugins and registering in config.json."""
    print("\n--- [1/2] Installing Plugin Link ---")
    PLUGINS_DIR.mkdir(parents=True, exist_ok=True)

    if PLUGIN_TARGET.exists() or PLUGIN_TARGET.is_symlink():
        try:
            if PLUGIN_TARGET.is_symlink():
                PLUGIN_TARGET.unlink()
            else:
                shutil.rmtree(PLUGIN_TARGET)
            print(f"[OK] Cleaned previous installation: {PLUGIN_TARGET}")
        except Exception as e:
            print(f"[ERROR] Failed to remove existing target: {e}")
            return

    try:
        PLUGIN_TARGET.symlink_to(SOURCE_DIR, target_is_directory=True)
        print(f"[OK] Created symlink: {PLUGIN_TARGET} -> {SOURCE_DIR}")
    except OSError:
        shutil.copytree(SOURCE_DIR, PLUGIN_TARGET, symlinks=True)
        print(f"[OK] Copied plugin to: {PLUGIN_TARGET}")

    print("\n--- [2/2] Updating Config Registry ---")
    config = load_json(CONFIG_FILE, {})
    plugins = config.setdefault("plugins", {})
    plugins["antigravity-font-settings"] = {"enabled": True}
    save_json(CONFIG_FILE, config)
    print(f"[OK] Enabled plugin in: {CONFIG_FILE}")

    print("\n[SUCCESS] Installation complete!")
    print("Tip: If Antigravity is currently running, restart it to launch the Sidecar engine.")


def uninstall_plugin(deep: bool = True):
    """Deep clean uninstall: terminate process, remove symlinks, clear config entries & cache."""
    print("\n--- [1/4] Stopping Running Sidecar Process ---")
    killed_count = kill_sidecar_processes(verbose=True)
    if killed_count > 0:
        print(f"[OK] Stopped {killed_count} active Sidecar process(es).")

    print("\n--- [2/4] Removing Plugin Directory / Symlink ---")
    if PLUGIN_TARGET.is_symlink():
        PLUGIN_TARGET.unlink()
        print(f"[OK] Removed symlink: {PLUGIN_TARGET}")
    elif PLUGIN_TARGET.exists():
        shutil.rmtree(PLUGIN_TARGET)
        print(f"[OK] Removed plugin directory: {PLUGIN_TARGET}")
    else:
        print("[INFO] Plugin symlink/directory not present.")

    print("\n--- [3/4] Purging Configuration Registry ---")
    config = load_json(CONFIG_FILE, {})
    modified = False

    # Remove plugins entry
    plugins = config.get("plugins", {})
    if "antigravity-font-settings" in plugins:
        del plugins["antigravity-font-settings"]
        modified = True
        print("[OK] Removed entry from config.json ['plugins'].")

    # Remove sidecars entry
    sidecars = config.get("sidecars", {})
    if "antigravity-font-settings/engine" in sidecars:
        del sidecars["antigravity-font-settings/engine"]
        modified = True
        print("[OK] Removed entry from config.json ['sidecars'].")

    if modified:
        save_json(CONFIG_FILE, config)
    else:
        print("[INFO] No registry entries found in config.json.")

    print("\n--- [4/4] Purging Sidecar Data & Cache ---")
    if deep and SIDECAR_DATA_DIR.exists():
        try:
            shutil.rmtree(SIDECAR_DATA_DIR)
            print(f"[OK] Purged sidecar data directory: {SIDECAR_DATA_DIR}")
        except Exception as e:
            print(f"[WARN] Failed to purge sidecar data: {e}")
    else:
        print("[INFO] No sidecar data directory remaining.")

    # Clean local ephemeral files if present
    local_sidecar_data = SOURCE_DIR / "sidecars" / "engine" / "data"
    if local_sidecar_data.exists():
        shutil.rmtree(local_sidecar_data)
        print(f"[OK] Cleaned local sidecar data: {local_sidecar_data}")

    print("\n[SUCCESS] Deep clean uninstallation complete! Zero residual files left.")


def set_enabled(enable: bool):
    """Enable or disable plugin in config.json."""
    config = load_json(CONFIG_FILE, {})
    plugins = config.setdefault("plugins", {})
    entry = plugins.setdefault("antigravity-font-settings", {})
    entry["enabled"] = enable
    save_json(CONFIG_FILE, config)
    status_text = "enabled" if enable else "disabled"
    print(f"\n[OK] Plugin is now {status_text} in config.json.")


def check_status():
    """Inspect and report current plugin and engine status."""
    installed = PLUGIN_TARGET.exists() or PLUGIN_TARGET.is_symlink()
    link_type = "Symlink" if PLUGIN_TARGET.is_symlink() else "Directory"

    config = load_json(CONFIG_FILE, {})
    is_enabled = config.get("plugins", {}).get("antigravity-font-settings", {}).get("enabled", False)
    sidecar_registered = "antigravity-font-settings/engine" in config.get("sidecars", {})

    pids = get_sidecar_pids()
    sidecar_data_exists = SIDECAR_DATA_DIR.exists()

    # Check DevTools port
    if sys.platform == "darwin":
        profile = HOME / "Library" / "Application Support" / "Antigravity"
    elif sys.platform == "win32":
        profile = Path(os.environ.get("LOCALAPPDATA", str(HOME / "AppData" / "Local"))) / "Antigravity"
    else:
        profile = Path(os.environ.get("XDG_CONFIG_HOME", str(HOME / ".config"))) / "Antigravity"

    port_file = profile / "DevToolsActivePort"
    port_status = "Not running"
    if port_file.exists():
        try:
            port = port_file.read_text().splitlines()[0].strip()
            port_status = f"Active (CDP Port: {port})"
        except Exception:
            port_status = "Active (Port file readable)"

    print("\n========================================================")
    print("        Antigravity Font Settings - Status Report       ")
    print("========================================================")
    print(f"  Plugin Installed:   {'Yes (' + link_type + ')' if installed else 'No'}")
    print(f"  Plugin Enabled:     {'Yes' if is_enabled else 'No'}")
    print(f"  Sidecar Registered: {'Yes' if sidecar_registered else 'No'}")
    if pids:
        print(f"  Sidecar Process:    Running (PID: {', '.join(map(str, pids))})")
    else:
        print("  Sidecar Process:    Not running")
    print(f"  Sidecar User Data:  {'Exists (' + str(SIDECAR_DATA_DIR) + ')' if sidecar_data_exists else 'Clean (None)'}")
    print(f"  Host App Status:    {port_status}")
    print("========================================================")


def restart_sidecar():
    """Restart Sidecar engine by terminating running process for supervisor reload."""
    print("\n--- Restarting Sidecar Engine ---")
    killed = kill_sidecar_processes(verbose=True)
    if killed > 0:
        print("[OK] Existing engine stopped. Antigravity supervisor will respawn it automatically.")
    else:
        print("[INFO] Engine was not running. If Antigravity is open, it will launch on next request.")


def interactive_menu():
    """Display interactive numeric menu in terminal."""
    while True:
        print("\n========================================================")
        print("         Antigravity 字体设置插件管理器 (v1.0.0)         ")
        print("========================================================")
        print("  [1] 安装并启用插件 (Install & Enable)")
        print("  [2] 彻底纯净卸载插件 (Deep Clean Uninstall)")
        print("  [3] 查看当前插件与引擎状态 (Check Status)")
        print("  [4] 启用插件 (Enable)")
        print("  [5] 禁用插件 (Disable)")
        print("  [6] 重启/停止 Sidecar 引擎进程 (Restart Sidecar)")
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
            restart_sidecar()
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
        choices=["install", "uninstall", "enable", "disable", "status", "restart"],
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
    elif args.action == "restart":
        restart_sidecar()


if __name__ == "__main__":
    main()
