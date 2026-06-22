#!/usr/bin/env bash

set -euo pipefail

# 本地 Docker 构建和部署脚本
# 用于从源码构建并运行容器

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "================================================"
echo "Meta API Hub - 本地 Docker 部署"
echo "================================================"
echo

# 检查必要的命令
for cmd in docker git; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "错误: 未找到命令 '$cmd'" >&2
    exit 1
  fi
done

# 检查 .env 文件
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo "错误: 未找到 $SCRIPT_DIR/.env 文件" >&2
  echo "请先复制 .env.example 并配置:" >&2
  echo "  cp $SCRIPT_DIR/.env.example $SCRIPT_DIR/.env" >&2
  echo "  # 然后编辑 .env 文件填写你的配置" >&2
  exit 1
fi

# 确认配置
echo "📋 当前配置:"
echo "  - 工作目录: $ROOT_DIR"
echo "  - 数据目录: $SCRIPT_DIR/data"
echo "  - 环境配置: $SCRIPT_DIR/.env"
echo

# 检查是否有运行中的容器
if docker compose -f "$SCRIPT_DIR/docker-compose.yml" --env-file "$SCRIPT_DIR/.env" ps | grep -q "Up"; then
  echo "⚠️  检测到运行中的容器"
  read -p "是否停止并重新构建？(y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🛑 停止容器..."
    docker compose -f "$SCRIPT_DIR/docker-compose.yml" --env-file "$SCRIPT_DIR/.env" down
  else
    echo "取消部署"
    exit 0
  fi
fi

# 创建数据目录
mkdir -p "$SCRIPT_DIR/data"

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker build -f "$SCRIPT_DIR/Dockerfile" -t metapi:local "$ROOT_DIR"

echo
echo "✅ 镜像构建完成"
echo

# 启动容器
echo "🚀 启动容器..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" --env-file "$SCRIPT_DIR/.env" up -d

echo
echo "⏳ 等待服务启动..."
sleep 3

# 显示状态
echo
echo "📊 容器状态:"
docker compose -f "$SCRIPT_DIR/docker-compose.yml" --env-file "$SCRIPT_DIR/.env" ps

echo
echo "📝 最近日志:"
docker compose -f "$SCRIPT_DIR/docker-compose.yml" --env-file "$SCRIPT_DIR/.env" logs --tail 30

echo
echo "================================================"
echo "✅ 部署完成！"
echo "================================================"
echo
echo "服务地址: http://127.0.0.1:4000"
echo
echo "常用命令:"
echo "  查看日志: docker compose -f $SCRIPT_DIR/docker-compose.yml logs -f"
echo "  停止服务: docker compose -f $SCRIPT_DIR/docker-compose.yml down"
echo "  重启服务: docker compose -f $SCRIPT_DIR/docker-compose.yml restart"
echo "  进入容器: docker compose -f $SCRIPT_DIR/docker-compose.yml exec metapi sh"
echo
