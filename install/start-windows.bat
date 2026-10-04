@echo off
chcp 65001 >nul
title 我的每日情报台 Delivery v1.0.0
echo.
echo ================================================
echo   我的每日情报台 Delivery v1.0.0
echo ================================================
echo.
where docker >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 Docker。
  echo 请先安装 Docker Desktop：
  echo https://www.docker.com/products/docker-desktop/
  pause
  exit /b 1
)
if not exist .env (
  if exist .env.example (
    copy .env.example .env >nul
    echo [提示] 已生成 .env。
    echo 请先打开 .env，填写 LLM_API_KEY，并确认管理员密码和密钥。
    echo 保存后重新双击本文件。
    start notepad .env
    pause
    exit /b 0
  )
)
findstr /R "^LLM_API_KEY=.$" .env >nul 2>nul
echo [1/3] 构建镜像...
docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com
if errorlevel 1 goto :fail
echo [2/3] 启动服务...
docker compose up -d
if errorlevel 1 goto :fail
echo [3/3] 检查状态...
docker compose ps
echo.
echo 安装/启动完成。
echo 前台：http://localhost:3000
echo 后台：http://localhost:3000/admin
echo.
start http://localhost:3000
pause
exit /b 0

:fail
echo.
echo [失败] 请查看上方错误。
echo 可执行：docker compose logs --tail=200
pause
exit /b 1
