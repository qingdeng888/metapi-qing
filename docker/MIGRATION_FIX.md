## ⚠️ 迁移问题已修复

之前的错误是因为 `_journal.json` 中有一个不存在的迁移文件引用。

### 🔧 修复内容

- ✅ 删除了重复的 `0026_secret_captain_stacy` 条目
- ✅ 修正了迁移索引顺序

### 🚀 重新部署步骤

```bash
# 1. 拉取最新代码
cd /path/to/metapi-qing
git pull origin dev

# 2. 停止并删除现有容器
cd docker
docker compose down

# 3. 重新构建和部署
./deploy-local.sh
```

### 📋 完整的迁移列表

现在的迁移顺序：
- 0025_site_post_refresh_probe.sql
- 0026_site_probe_latency_threshold.sql  
- 0027_site_client_spoofing.sql ⬅️ 新增的客户端伪装功能

容器启动时会自动按顺序执行这些迁移。
