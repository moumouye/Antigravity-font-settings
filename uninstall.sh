#!/usr/bin/env bash
# Antigravity Font Settings - Quick One-line Uninstaller for macOS & Linux
set -euo pipefail

CONFIG_DIR="$HOME/.gemini/config"
PLUGINS_DIR="$CONFIG_DIR/plugins"
TARGET_DIR="$PLUGINS_DIR/antigravity-font-settings"
CONFIG_FILE="$CONFIG_DIR/config.json"
SIDECAR_DATA="$HOME/.gemini/antigravity/sidecar_data/antigravity-font-settings"
PLUGIN_DATA="$HOME/.gemini/antigravity/plugin_data/antigravity-font-settings"

echo "========================================================"
echo "    Antigravity Font Settings - 快速一键卸载程序        "
echo "========================================================"

echo "[1/4] 正在终止后台 Sidecar 引擎进程..."
pkill -f "antigravity-font-settings.*main.mjs" 2>/dev/null || true
pkill -f "sidecars/engine/main.mjs" 2>/dev/null || true

echo "[2/4] 正在移除插件安装目录与软链接..."
if [ -L "$TARGET_DIR" ] || [ -d "$TARGET_DIR" ]; then
    rm -rf "$TARGET_DIR"
    echo "[OK] 已清理插件目录: $TARGET_DIR"
else
    echo "[INFO] 插件目录不存在，跳过。"
fi

echo "[3/4] 正在注销配置文件注册项..."
if command -v python3 >/dev/null 2>&1; then
    python3 -c "
import json, pathlib
cfg_file = pathlib.Path.home() / '.gemini' / 'config' / 'config.json'
if cfg_file.exists():
    try:
        cfg = json.loads(cfg_file.read_text(encoding='utf-8'))
        modified = False
        if 'plugins' in cfg and 'antigravity-font-settings' in cfg['plugins']:
            del cfg['plugins']['antigravity-font-settings']
            modified = True
        if 'sidecars' in cfg and 'antigravity-font-settings/engine' in cfg['sidecars']:
            del cfg['sidecars']['antigravity-font-settings/engine']
            modified = True
        if modified:
            cfg_file.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
            print('[OK] 已从 config.json 清理注册项。')
    except Exception as e:
        print(f'[WARN] 更新 config.json 失败: {e}')
"
elif command -v node >/dev/null 2>&1; then
    node -e "
const fs = require('fs');
const path = require('path');
const cfgPath = path.join(process.env.HOME, '.gemini/config/config.json');
try {
    if (fs.existsSync(cfgPath)) {
        const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        let modified = false;
        if (cfg.plugins && cfg.plugins['antigravity-font-settings']) {
            delete cfg.plugins['antigravity-font-settings'];
            modified = true;
        }
        if (cfg.sidecars && cfg.sidecars['antigravity-font-settings/engine']) {
            delete cfg.sidecars['antigravity-font-settings/engine'];
            modified = true;
        }
        if (modified) {
            fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
            console.log('[OK] 已从 config.json 清理注册项。');
        }
    }
} catch (e) {
    console.warn('[WARN] 更新 config.json 失败:', e.message);
}
"
fi

echo "[4/4] 正在清除运行数据缓存与宿主残留目录..."
rm -rf "$SIDECAR_DATA"
rm -rf "$PLUGIN_DATA"
echo "[OK] 已清理数据缓存与残留目录 (零残留)。"

echo "========================================================"
echo "🎉 卸载完成！所有关联文件与数据已彻底清理。"
echo "提示: 请完全重启 Antigravity 客户端以完全恢复系统默认排版。"
echo "========================================================"
