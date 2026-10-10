#!/usr/bin/env python3
"""Antigravity Font Settings - Plugin Lifecycle Manager."""
import argparse
import json
import os
import shutil
import sys
from pathlib import Path

SOURCE_DIR = Path(__file__).resolve().parent
HOME = Path.home()
CONFIG_DIR = HOME / ".gemini" / "config"
PLUGINS_DIR = CONFIG_DIR / "plugins"
PLUGIN_TARGET = PLUGINS_DIR / "antigravity-font-settings"
CONFIG_FILE = CONFIG_DIR / "config.json"


def load_json(path, default=None):
    if not path.exists():
        return default if default is not None else {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default if default is not None else {}


def save_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + ".tmp")
    temp.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temp.replace(path)


def install_plugin():
    PLUGINS_DIR.mkdir(parents=True, exist_ok=True)

    if PLUGIN_TARGET.exists() or PLUGIN_TARGET.is_symlink():
        if PLUGIN_TARGET.is_symlink() or PLUGIN_TARGET.is_dir():
            try:
                if PLUGIN_TARGET.is_symlink():
                    PLUGIN_TARGET.unlink()
                else:
                    shutil.rmtree(PLUGIN_TARGET)
            except Exception as e:
                print(f"Error removing existing target: {e}")
                sys.exit(1)

    try:
        PLUGIN_TARGET.symlink_to(SOURCE_DIR, target_is_directory=True)
        print(f"Linked plugin to: {PLUGIN_TARGET}")
    except OSError:
        shutil.copytree(SOURCE_DIR, PLUGIN_TARGET, symlinks=True)
        print(f"Copied plugin to: {PLUGIN_TARGET}")

    config = load_json(CONFIG_FILE, {})
    plugins = config.setdefault("plugins", {})
    plugins["antigravity-font-settings"] = {"enabled": True}
    save_json(CONFIG_FILE, config)

    print("Plugin enabled in config.json.")
    print("\n[Done] Please fully quit and reopen Antigravity to load the Font Settings extension.")


def uninstall_plugin():
    if PLUGIN_TARGET.is_symlink():
        PLUGIN_TARGET.unlink()
        print(f"Removed symlink: {PLUGIN_TARGET}")
    elif PLUGIN_TARGET.exists():
        shutil.rmtree(PLUGIN_TARGET)
        print(f"Removed plugin directory: {PLUGIN_TARGET}")
    else:
        print("Plugin is not currently installed.")

    config = load_json(CONFIG_FILE, {})
    plugins = config.get("plugins", {})
    if "antigravity-font-settings" in plugins:
        del plugins["antigravity-font-settings"]
        save_json(CONFIG_FILE, config)
        print("Removed from config.json.")

    print("\n[Done] Uninstallation complete.")


def set_enabled(enable: bool):
    config = load_json(CONFIG_FILE, {})
    plugins = config.setdefault("plugins", {})
    entry = plugins.setdefault("antigravity-font-settings", {})
    entry["enabled"] = enable
    save_json(CONFIG_FILE, config)
    print(f"Plugin {'enabled' if enable else 'disabled'}.")


def check_status():
    installed = PLUGIN_TARGET.exists() or PLUGIN_TARGET.is_symlink()
    config = load_json(CONFIG_FILE, {})
    is_enabled = config.get("plugins", {}).get("antigravity-font-settings", {}).get("enabled", False)

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
            port_status = f"Active on port {port}"
        except Exception:
            port_status = "Available (failed to read port)"

    print("=== Antigravity Font Settings Status ===")
    print(f"Installed:  {'Yes (' + str(PLUGIN_TARGET) + ')' if installed else 'No'}")
    print(f"Enabled:    {'Yes' if is_enabled else 'No'}")
    print(f"Electron:   {port_status}")


def main():
    parser = argparse.ArgumentParser(description="Antigravity Font Settings Manager")
    parser.add_argument("action", choices=["install", "uninstall", "enable", "disable", "status"], help="Action to perform")
    args = parser.parse_args()

    if args.action == "install":
        install_plugin()
    elif args.action == "uninstall":
        uninstall_plugin()
    elif args.action == "enable":
        set_enabled(True)
    elif args.action == "disable":
        set_enabled(False)
    elif args.action == "status":
        check_status()


if __name__ == "__main__":
    main()
