# Docker 部署说明

## 快速开始

### 1. 准备环境变量

复制 `.env.example` 为 `.env` 并填写必要的配置：

```bash
cp .env.example .env
```

**必须配置的变量：**
- `ACCOUNT_CREDENTIAL_SECRET` - 账号凭证加密密钥（32+ 字节随机字符串）
- `AUTH_TOKEN` - 管理员访问令牌
- `PROXY_TOKEN` - API 代理访问令牌

### 2. 构建并启动服务

```bash
# 构建镜像
docker compose build

# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f
```

### 3. 访问服务

服务启动后访问：`http://localhost:4000`

## 配置说明

### 端口映射

默认映射 `4000:4000`，可以在 `.env` 中修改：

```env
PORT=4000
```

### 数据持久化

数据存储在 `./data` 目录，已通过 volume 挂载：

```yaml
volumes:
  - ./data:/app/data
```

### 环境变量

所有 `.env` 文件中的变量都会自动加载到容器中（通过 `env_file` 配置）。

## 常用命令

```bash
# 停止服务
docker compose down

# 重启服务
docker compose restart

# 查看日志
docker compose logs -f metapi

# 进入容器
docker compose exec metapi sh

# 重新构建并启动
docker compose up -d --build

# 清理并重新部署
docker compose down -v
docker compose up -d --build
```

## 文件说明

- `Dockerfile` - Docker 镜像构建文件
- `docker-compose.yml` - Docker Compose 编排文件
- `.dockerignore` - 构建时忽略的文件
- `.env` - 环境变量配置（需自行创建，不纳入版本控制）
- `.env.example` - 环境变量示例文件

## 注意事项

1. **不要将 `.env` 文件提交到 Git**
2. **生产环境务必修改默认的 `AUTH_TOKEN` 和 `PROXY_TOKEN`**
3. **`ACCOUNT_CREDENTIAL_SECRET` 必须使用强随机密钥**
4. 数据库文件存储在 `./data` 目录，请定期备份
