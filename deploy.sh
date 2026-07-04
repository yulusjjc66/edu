#!/bin/bash
# 在服务器上运行：拉取最新代码并重启服务
set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

echo ">>> 拉取代码..."
git pull origin main

echo ">>> 安装依赖..."
npm install --omit=dev

if [ ! -f config.json ]; then
  echo ">>> 首次部署：从模板创建 config.json"
  cp config.example.json config.json
  echo "    请编辑 config.json 设置管理密码"
fi

echo ">>> 重启服务..."
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart edu 2>/dev/null || pm2 start server.js --name edu
  pm2 save
else
  echo "    未安装 pm2，请手动运行: npm start"
  echo "    建议安装: npm install -g pm2"
fi

echo ">>> 部署完成"
