@echo off
chcp 65001 >nul
title 餐量智估Web原型 - 局域网访问
echo ============================================================
echo   餐量智估Web 原型
echo   版本：2026-09-01 · 本地流程原型 · 纯静态架构
echo ============================================================
echo.

:: 检查Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Python，请先安装Python 3.x
    pause
    exit /b 1
)

:: 配置（无密钥，仅环境变量占位）
set PORT=8765
set HOST=0.0.0.0
set DEMO_MODE=true
set API_KEY=
echo [配置] 端口：%PORT%  绑定：%HOST%  Demo模式：%DEMO_MODE%
echo [配置] API_KEY：（空值占位，无真实密钥）
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
echo   同一WiFi下的评委可通过局域网地址访问
echo   按 Ctrl+C 停止服务
echo ============================================================
echo.

:: 切换到脚本所在目录
cd /d "%~dp0"

:: 启动Python http.server
python -m http.server %PORT% --bind %HOST%

pause
