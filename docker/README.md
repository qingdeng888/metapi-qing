# Meta API Hub - Docker 本地部署指南

## 🚀 快速开始

### 1. 配置环境变量

```bash
cd docker
cp .env.example .env
# 编辑 .env 文件，至少修改以下两项：
# - AUTH_TOKEN: 管理后台登录令牌
# - PROXY_TOKEN: OpenAI 兼容代理 API 令牌
```

### 2. 一键部署

```bash
./deploy-local.sh
```

脚本会自动：
- ✅ 检查依赖（docker, git）
- ✅ 构建 Docker 镜像
- ✅ 启动容器
- ✅ 执行数据库迁移
- ✅ 显示服务状态和日志

### 3. 访问服务

服务启动后访问：**http://127.0.0.1:4000**

使用 `AUTH_TOKEN` 中配置的令牌登录管理后台。

---

## 📋 常用命令

### 查看日志
```bash
cd docker
docker compose logs -f
```

### 重启服务
```bash
cd docker
docker compose restart
```

### 停止服务
```bash
cd docker
docker compose down
```

### 进入容器
```bash
cd docker
docker compose exec metapi sh
```

### 重新构建并部署
```bash
cd docker
docker compose down
docker build -f Dockerfile -t metapi:local ..
docker compose up -d
```

或者直接运行：
```bash
./deploy-local.sh
```

---

## 🗂️ 目录结构

```
docker/
├── .env              # 环境变量配置（需要自己创建）
├── .env.example      # 环境变量模板
├── docker-compose.yml # Docker Compose 配置
├── Dockerfile        # Docker 镜像构建配置
├── deploy-local.sh   # 一键部署脚本
└── data/             # 数据持久化目录（自动创建）
    └── data.db       # SQLite 数据库
```

---

## 🔧 配置说明

### 必需配置

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `AUTH_TOKEN` | 管理后台认证令牌 | `your-secure-admin-token` |
| `PROXY_TOKEN` | OpenAI 兼容 API 令牌 | `sk-your-proxy-token` |

### 可选配置

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `PORT` | 服务端口 | `4000` |
| `TZ` | 时区 | `Asia/Shanghai` |
| `CHECKIN_CRON` | 自动签到 Cron | `0 8 * * *` (每天 8:00) |
| `BALANCE_REFRESH_CRON` | 余额刷新 Cron | `0 * * * *` (每小时) |
| `TELEGRAM_ENABLED` | 启用 Telegram 通知 | `false` |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | - |
| `TELEGRAM_CHAT_ID` | Telegram Chat ID | - |

---

## 📊 数据持久化

- 数据库文件：`docker/data/data.db`
- 备份数据库：`cp docker/data/data.db docker/data/data.db.backup`
- 清空数据重新开始：`rm docker/data/data.db`（容器会自动初始化）

---

## 🔄 更新部署

### 方式 1：使用脚本（推荐）
```bash
cd docker
./deploy-local.sh
```

### 方式 2：手动更新
```bash
cd docker
docker compose down              # 停止容器
git pull origin dev              # 拉取最新代码
docker build -f Dockerfile -t metapi:local ..  # 重新构建
docker compose up -d             # 启动容器
```

---

## ❓ 故障排查

### 容器无法启动
```bash
# 查看容器日志
docker compose logs

# 检查端口占用
lsof -i :4000
```

### 数据库迁移失败
```bash
# 进入容器手动执行迁移
docker compose exec metapi sh
node dist/server/db/migrate.js
```

### 重置服务
```bash
cd docker
docker compose down
rm -rf data/
docker build -f Dockerfile -t metapi:local ..
docker compose up -d
```

---

## 📮 客户端伪装功能

新增的客户端伪装功能已集成：
- 在站点管理中可以选择伪装成 **Codex CLI** 或 **Claude Code**
- 自动注入对应客户端的特征请求头
- 绕过部分 API 站点的客户端限制

部署后无需额外配置，数据库迁移会自动添加 `clientSpoofing` 字段。
