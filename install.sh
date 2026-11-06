#!/usr/bin/env bash
# Antigravity Font Settings - Quick One-line Installer for macOS & Linux
set -euo pipefail

REPO_NAME="${ANTIGRAVITY_FONT_REPO:-moumouye/Antigravity-font-settings}"
BRANCH="${ANTIGRAVITY_FONT_BRANCH:-main}"
CONFIG_DIR="$HOME/.gemini/config"
PLUGINS_DIR="$CONFIG_DIR/plugins"
TARGET_DIR="$PLUGINS_DIR/antigravity-font-settings"

echo "========================================================"
echo "    Antigravity Font Settings - 快速一键安装程序        "
echo "========================================================"

mkdir -p "$PLUGINS_DIR"

if [ -d "$TARGET_DIR/.git" ]; then
    echo "[1/3] 检测到已存在安装，正在同步拉取最新代码..."
    git -C "$TARGET_DIR" pull --ff-only || true
elif command -v git >/dev/null 2>&1; then
    echo "[1/3] 正在通过 Git 克隆插件仓库..."
    rm -rf "$TARGET_DIR"
    git clone --depth 1 "https://github.com/${REPO_NAME}.git" "$TARGET_DIR"
else
    echo "[1/3] 未检测到 Git，正在下载源码归档包..."
    rm -rf "$TARGET_DIR"
    TMP_ZIP="/tmp/antigravity-font-settings-$$.zip"
    TMP_DIR="/tmp/antigravity-font-settings-$$"
    curl -fsSL "https://github.com/${REPO_NAME}/archive/refs/heads/${BRANCH}.zip" -o "$TMP_ZIP"
    unzip -q "$TMP_ZIP" -d "$TMP_DIR"
    mv "$TMP_DIR"/Antigravity-font-settings-* "$TARGET_DIR"
    rm -rf "$TMP_ZIP" "$TMP_DIR"
fi

echo "[2/3] 注册并激活插件配置..."
if command -v python3 >/dev/null 2>&1; then
    python3 "$TARGET_DIR/manage.py" install
elif command -v node >/dev/null 2>&1; then
    node -e "
    const fs = require('fs');
    const path = require('path');
    const cfgPath = path.join(process.env.HOME, '.gemini', 'config', 'config.json');
    let cfg = {};
    try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch {}
    if (!cfg.plugins) cfg.plugins = {};
    cfg.plugins['antigravity-font-settings'] = { enabled: true };
    fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
    "
    echo "[OK] 已通过 Node.js 成功注册插件到 config.json。"
else
    echo "[WARN] 未检测到 python3 或 node，请手动运行 manage.py 完成注册。"
fi

echo "========================================================"
echo "🎉 安装完成！请完全退出并重新启动 Antigravity 客户端即可享受个性化字体设置。"
echo "========================================================"
