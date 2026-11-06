# Antigravity Font Settings - Quick One-line Uninstaller for Windows PowerShell
$ErrorActionPreference = "SilentlyContinue"

$ConfigDir = Join-Path $HOME ".gemini\config"
$PluginsDir = Join-Path $ConfigDir "plugins"
$TargetDir = Join-Path $PluginsDir "antigravity-font-settings"
$ConfigFile = Join-Path $ConfigDir "config.json"
$SidecarData = Join-Path $HOME ".gemini\antigravity\sidecar_data\antigravity-font-settings"
$PluginData = Join-Path $HOME ".gemini\antigravity\plugin_data\antigravity-font-settings"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "    Antigravity Font Settings - Windows 一键卸载程序      " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "[1/4] 正在终止后台 Sidecar 引擎进程..." -ForegroundColor Yellow
Get-Process | Where-Object { 
    $_.CommandLine -like "*antigravity-font-settings*" -or $_.CommandLine -like "*sidecars\engine\main.mjs*" 
} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "[2/4] 正在移除插件安装目录与软链接..." -ForegroundColor Yellow
if (Test-Path $TargetDir) {
    Remove-Item -Recurse -Force $TargetDir -ErrorAction SilentlyContinue
    Write-Host "[OK] 已清理插件目录: $TargetDir" -ForegroundColor Green
} else {
    Write-Host "[INFO] 插件目录不存在，跳过。" -ForegroundColor Gray
}

Write-Host "[3/4] 正在注销配置文件注册项..." -ForegroundColor Yellow
if (Test-Path $ConfigFile) {
    try {
        $content = Get-Content -Raw -Path $ConfigFile -Encoding UTF8
        $json = ConvertFrom-Json $content
        $modified = $false

        if ($json.plugins -and $json.plugins.'antigravity-font-settings') {
            $json.plugins.PSObject.Properties.Remove('antigravity-font-settings')
            $modified = $true
        }
        if ($json.sidecars -and $json.sidecars.'antigravity-font-settings/engine') {
            $json.sidecars.PSObject.Properties.Remove('antigravity-font-settings/engine')
            $modified = $true
        }

        if ($modified) {
            $newContent = ConvertTo-Json $json -Depth 10
            Set-Content -Path $ConfigFile -Value $newContent -Encoding UTF8
            Write-Host "[OK] 已从 config.json 清理注册项。" -ForegroundColor Green
        }
    } catch {
        Write-Host "[WARN] 清理 config.json 失败: $_" -ForegroundColor DarkYellow
    }
}

Write-Host "[4/4] 正在清除运行数据缓存与宿主残留目录..." -ForegroundColor Yellow
if (Test-Path $SidecarData) {
    Remove-Item -Recurse -Force $SidecarData -ErrorAction SilentlyContinue
}
if (Test-Path $PluginData) {
    Remove-Item -Recurse -Force $PluginData -ErrorAction SilentlyContinue
}
Write-Host "[OK] 已清理数据缓存与残留目录 (零残留)。" -ForegroundColor Green

Write-Host "========================================================" -ForegroundColor Green
Write-Host "🎉 卸载完成！所有关联文件与数据已彻底清理。" -ForegroundColor Green
Write-Host "提示: 请完全重启 Antigravity 客户端以完全恢复系统默认排版。" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
