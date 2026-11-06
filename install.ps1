# Antigravity Font Settings - Quick One-line Installer for Windows PowerShell
$ErrorActionPreference = "Stop"

$RepoName = if ($env:ANTIGRAVITY_FONT_REPO) { $env:ANTIGRAVITY_FONT_REPO } else { "moumouye/Antigravity-font-settings" }
$Branch = if ($env:ANTIGRAVITY_FONT_BRANCH) { $env:ANTIGRAVITY_FONT_BRANCH } else { "main" }
$ConfigDir = Join-Path $HOME ".gemini\config"
$PluginsDir = Join-Path $ConfigDir "plugins"
$TargetDir = Join-Path $PluginsDir "antigravity-font-settings"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "    Antigravity Font Settings - Windows 快速安装程序      " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

New-Item -ItemType Directory -Force -Path $PluginsDir | Out-Null

if (Test-Path (Join-Path $TargetDir ".git")) {
    Write-Host "[1/3] 检测到已存在安装，正在同步拉取最新代码..." -ForegroundColor Yellow
    git -C $TargetDir pull --ff-only
} elseif (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host "[1/3] 正在通过 Git 克隆插件仓库..." -ForegroundColor Yellow
    if (Test-Path $TargetDir) { Remove-Item -Recurse -Force $TargetDir }
    git clone --depth 1 "https://github.com/$RepoName.git" $TargetDir
} else {
    Write-Host "[1/3] 未检测到 Git，正在下载源码归档压缩包..." -ForegroundColor Yellow
    if (Test-Path $TargetDir) { Remove-Item -Recurse -Force $TargetDir }
    $ZipPath = Join-Path $env:TEMP "antigravity-font-settings.zip"
    $ExtractPath = Join-Path $env:TEMP "antigravity-font-temp"
    if (Test-Path $ExtractPath) { Remove-Item -Recurse -Force $ExtractPath }

    Invoke-WebRequest -Uri "https://github.com/$RepoName/archive/refs/heads/$Branch.zip" -OutFile $ZipPath
    Expand-Archive -Path $ZipPath -DestinationPath $ExtractPath
    $SubFolder = Get-ChildItem -Path $ExtractPath | Where-Object { $_.PSIsContainer } | Select-Object -First 1
    Move-Item -Path $SubFolder.FullName -Destination $TargetDir
    Remove-Item -Force $ZipPath
    Remove-Item -Recurse -Force $ExtractPath
}

Write-Host "[2/3] 注册并激活插件配置..." -ForegroundColor Yellow
if (Get-Command python -ErrorAction SilentlyContinue) {
    python (Join-Path $TargetDir "manage.py") install
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    python3 (Join-Path $TargetDir "manage.py") install
} elseif (Get-Command node -ErrorAction SilentlyContinue) {
    node -e "
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const cfgPath = path.join(os.homedir(), '.gemini', 'config', 'config.json');
    let cfg = {};
    try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch {}
    if (!cfg.plugins) cfg.plugins = {};
    cfg.plugins['antigravity-font-settings'] = { enabled: true };
    fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
    "
    Write-Host "[OK] 已通过 Node.js 成功注册插件到 config.json。" -ForegroundColor Green
} else {
    Write-Host "[WARN] 未检测到 python 或 node，请手动运行 manage.py 完成注册。" -ForegroundColor Red
}

Write-Host "========================================================" -ForegroundColor Green
Write-Host "🎉 安装完成！请完全退出并重新启动 Antigravity 客户端即可体验！" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
