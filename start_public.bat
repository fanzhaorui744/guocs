@echo off
chcp 65001 >nul
title 营养智链 - 局域网访问
echo ============================================================
echo   营养智链 —— 外卖个性化营养管理平台
echo   本地静态服务（完整能力请使用后端同源启动，见根目录 README）
echo ============================================================
echo.

:: 检查Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Python，请先安装Python 3.x
    pause
    exit /b 1
)

:: 服务配置
set PORT=8765
set HOST=0.0.0.0
echo [配置] 端口：%PORT%  绑定：%HOST%
echo.

:: 获取局域网IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=* delims= " %%b in ("%%a") do set LOCAL_IP=%%b
)

echo [启动] 正在启动静态文件服务器...
echo.
echo ============================================================
echo   访问地址：
echo   本机：    http://127.0.0.1:%PORT%/
echo   局域网：  http://%LOCAL_IP%:%PORT%/
echo.
echo   同一WiFi下可通过局域网地址访问
echo   按 Ctrl+C 停止服务
echo ============================================================
echo.

:: 切换到脚本所在目录
cd /d "%~dp0"

:: 启动Python http.server
python -m http.server %PORT% --bind %HOST%

pause
