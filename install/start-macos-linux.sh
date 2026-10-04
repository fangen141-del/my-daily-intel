#!/usr/bin/env bash
set -e
printf "\n===============================================\n"
printf "  我的每日情报台 Delivery v1.0.0\n"
printf "===============================================\n\n"

if ! command -v docker >/dev/null 2>&1; then
  echo "[错误] 未检测到 Docker。"
  echo "请先安装 Docker Desktop / Docker Engine。"
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[提示] 已生成 .env。"
  echo "请先编辑 .env，填写 LLM_API_KEY，并确认管理员密码和密钥。"
  echo "保存后再次运行：bash install/start-macos-linux.sh"
  exit 0
fi

echo "[1/3] 构建镜像..."
docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com

echo "[2/3] 启动服务..."
docker compose up -d

echo "[3/3] 检查状态..."
docker compose ps

echo
echo "安装/启动完成。"
echo "前台：http://localhost:3000"
echo "后台：http://localhost:3000/admin"
