#!/bin/bash
# 服务器首次初始化（在阿里云 Workbench 里执行一次）
set -e

install_nodejs() {
  if command -v node >/dev/null 2>&1; then
    echo "    Node.js 已安装: $(node -v)"
    return
  fi

  echo ">>> 安装 Node.js 20..."

  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg git
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  elif command -v yum >/dev/null 2>&1; then
    yum install -y ca-certificates curl git
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y ca-certificates curl git
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    dnf install -y nodejs
  else
    echo "错误：不支持的系统，请手动安装 Node.js 20"
    exit 1
  fi

  echo "    Node.js $(node -v) / npm $(npm -v)"
}

install_nodejs

echo ">>> 安装 pm2..."
npm install -g pm2

APP_DIR="/var/www/edu"
if [ ! -d "$APP_DIR/.git" ]; then
  echo ">>> 克隆仓库..."
  mkdir -p /var/www
  git clone https://github.com/yulusjjc66/edu.git "$APP_DIR"
fi

cd "$APP_DIR"
chmod +x deploy.sh

if [ ! -f config.json ]; then
  cp config.example.json config.json
  echo ">>> 请编辑 $APP_DIR/config.json 设置管理密码"
fi

npm install --omit=dev
pm2 start server.js --name edu
pm2 startup
pm2 save

echo ">>> 初始化完成"
echo ">>> 安全组请放行端口 3000，或配置 Nginx 反代 80"
echo ">>> 访问: http://$(curl -s ifconfig.me 2>/dev/null || echo '你的公网IP'):3000"
