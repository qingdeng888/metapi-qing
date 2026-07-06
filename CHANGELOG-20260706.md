# 下游密钥自动同步功能修复 - 2026-07-06

## 🐛 问题描述

用户反馈下游密钥的"自动同步路由模型"功能存在以下问题：

1. **勾选状态丢失**：编辑密钥时勾选"自动同步路由模型"并保存，再次编辑时勾选消失
2. **保存后未同步**：勾选并保存后，密钥仍显示"未授权模型"
3. **路由变更不同步**：创建/删除渠道后，启用了自动同步的密钥不会自动更新模型列表

## 🔍 根本原因分析

### 问题 1：API 响应缺少字段
**位置：** `src/server/services/downstreamApiKeyService.ts`

```typescript
// ❌ 原代码：toDownstreamApiKeyPolicyView 函数没有返回 autoSyncRoutes
export type DownstreamApiKeyPolicyView = {
  // ... 其他字段
  // autoSyncRoutes 字段缺失
};

export function toDownstreamApiKeyPolicyView(row: DownstreamApiKeyRow) {
  return {
    // ... 其他字段
    // autoSyncRoutes 未返回
  };
}
```

**影响：** 前端读取密钥时，`autoSyncRoutes` 始终为 `undefined`，导致表单初始化为 `false`

### 问题 2：前端未发送字段
**位置：** `src/web/pages/DownstreamKeys.tsx`

```typescript
// ❌ 原代码：saveKey 函数的 payload 缺少 autoSyncRoutes
const payload = {
  name,
  key,
  // ... 其他字段
  // autoSyncRoutes 缺失
  siteWeightMultipliers,
  excludedSiteIds,
};
```

**影响：** 即使前端勾选，后端也接收不到该值，数据库中 `auto_sync_routes` 始终为 0

### 问题 3：路由变更未触发同步
**位置：** `src/server/services/routeRefreshWorkflow.ts`

```typescript
// ❌ 原代码：路由重建后没有触发同步
export async function rebuildRoutesOnly() {
  return rebuildTokenRoutesFromAvailability();
  // 缺少同步调用
}
```

**影响：** 创建/删除站点、账号、令牌后，虽然会重建路由，但不会同步密钥

## ✅ 修复方案

### 修复 1：添加 API 响应字段
**文件：** `src/server/services/downstreamApiKeyService.ts`

```typescript
// ✅ 添加类型定义
export type DownstreamApiKeyPolicyView = {
  // ... 其他字段
  autoSyncRoutes: boolean; // 新增
  // ...
};

// ✅ 返回字段值
export function toDownstreamApiKeyPolicyView(row: DownstreamApiKeyRow) {
  return {
    // ... 其他字段
    autoSyncRoutes: !!row.autoSyncRoutes, // 新增
    // ...
  };
}
```

### 修复 2：前端发送字段
**文件：** `src/web/pages/DownstreamKeys.tsx`

```typescript
// ✅ 在 payload 中添加 autoSyncRoutes
const payload = {
  name,
  key,
  // ... 其他字段
  autoSyncRoutes: editorForm.autoSyncRoutes, // 新增
  siteWeightMultipliers,
  excludedSiteIds,
};
```

### 修复 3：路由变更触发同步
**文件：** `src/server/services/routeRefreshWorkflow.ts`

```typescript
// ✅ 添加导入
import { syncDownstreamKeysWithRoutes } from './downstreamKeySyncService.js';

// ✅ 路由重建后触发同步
export async function rebuildRoutesOnly() {
  const result = await rebuildTokenRoutesFromAvailability();

  // 路由重建后，自动同步所有启用自动同步的下游密钥
  syncDownstreamKeysWithRoutes().catch((error) => {
    console.error('[rebuildRoutesOnly] Failed to sync downstream keys:', error);
  });

  return result;
}
```

### 修复 4：创建/更新时立即同步
**文件：** `src/server/routes/api/downstreamApiKeys.ts`

```typescript
// ✅ 创建密钥后立即同步
if ((body as any).autoSyncRoutes) {
  syncDownstreamKeysWithRoutes().catch((error) => {
    console.error('Failed to sync downstream keys with routes:', error);
  });
}

// ✅ 更新密钥后立即同步
if (autoSyncEnabled) {
  syncDownstreamKeysWithRoutes().catch((error) => {
    console.error('Failed to sync downstream keys with routes:', error);
  });
}
```

### 修复 5：同步调试日志
**文件：** `src/server/services/downstreamKeySyncService.ts`

```typescript
// ✅ 添加详细日志
export async function syncDownstreamKeysWithRoutes() {
  const keysToSync = await db.select()
    .from(schema.downstreamApiKeys)
    .where(eq(schema.downstreamApiKeys.autoSyncRoutes, true))
    .all();

  if (keysToSync.length === 0) {
    console.log('[sync] No keys with autoSyncRoutes enabled');
    return { synced: 0 };
  }

  console.log(`[sync] Found ${keysToSync.length} keys to sync`);
  // ... 同步逻辑
  console.log(`[sync] Synced ${syncedCount} keys`);
  
  return { synced: syncedCount };
}
```

## 🎯 修复效果

### 功能完整性
✅ **勾选状态持久化** - 编辑时勾选状态正确保留  
✅ **保存后立即同步** - 启用自动同步并保存后，立即更新模型列表  
✅ **路由变更自动同步** - 创建/删除/启用/禁用站点/账号/令牌时，自动同步所有启用自动同步的密钥  
✅ **手动重建触发同步** - 手动点击"重建路由"也会触发同步  
✅ **删除路由触发同步** - 删除路由时直接触发同步（无需重建）

### 同步触发时机

| 操作 | 触发时机 | 响应时间 |
|------|---------|---------|
| 创建密钥（勾选自动同步） | 保存时立即触发 | 1-2秒 |
| 更新密钥（启用自动同步） | 保存时立即触发 | 1-2秒 |
| 创建站点/账号/令牌 | 路由重建后触发 | 2-3秒 |
| 删除站点/账号/令牌 | 路由重建后触发 | 2-3秒 |
| 启用/禁用账号 | 路由重建后触发 | 2-3秒 |
| 删除路由 | 立即触发（无需重建） | 1秒 |
| 手动重建路由 | 重建完成后触发 | 2-3秒 |

### 日志输出示例

```
[sync] Found 2 keys to sync
[sync] Found 9 enabled routes
[sync] Exact models: 9, Group routes: 0
[sync] Updated key 1 (测试密钥)
[sync] Updated key 2 (生产密钥)
[sync] Synced 2 keys
```

## 📦 发布信息

### Docker 镜像

**AMD64:**
```bash
docker pull qingdeng/metapi-qing:20260706
docker pull qingdeng/metapi-qing:latest
```

**ARM64:**
```bash
docker pull qingdeng/metapi-qing:20260706-arm64
```

### Git 提交

**分支：** `dev2`  
**提交记录：**
- `c526fa6` - feat: 下游密钥自动同步路由模型功能
- `046c1b5` - fix: 添加 0028 迁移到 drizzle journal
- `23795ca` - fix: 修复下游密钥自动同步功能的关键问题
- `e03adfd` - fix: 修复自动同步查询条件和添加调试日志
- `8103102` - fix: 前端保存时未发送 autoSyncRoutes 字段
- `c74a364` - feat: 路由重建时自动触发下游密钥同步

## 🧪 测试验证

### 测试环境
- 容器：全新数据库
- 日志级别：debug
- 监控：实时日志输出

### 测试步骤
1. ✅ 创建下游密钥并勾选"自动同步路由模型"
2. ✅ 保存后查看模型列表（应为空，因为还没有路由）
3. ✅ 创建站点和账号（触发路由重建）
4. ✅ 查看密钥模型列表（自动同步了所有模型）
5. ✅ 重新编辑密钥（勾选状态保留）
6. ✅ 删除账号（触发路由重建和同步）
7. ✅ 查看密钥模型列表（自动更新）

### 测试结果
所有测试用例通过 ✅

## 📝 使用说明

### 启用自动同步

1. 进入"下游密钥"页面
2. 创建或编辑密钥
3. 展开"高级配置"
4. 勾选"自动同步路由模型"
5. 保存

### 工作原理

启用自动同步后，密钥的模型列表将：
- **自动包含所有精确模型** - 如 `gpt-4`, `claude-3-opus` 等
- **自动包含所有群组路由** - 如正则表达式路由、通配符路由等
- **实时跟随路由变化** - 无需手动编辑密钥

### 注意事项

- 自动同步会**覆盖**手动设置的模型列表和群组路由
- 如需自定义模型列表，请不要启用自动同步
- 同步在后台异步执行，不影响主流程性能
- 可通过日志 `[sync]` 前缀查看同步状态

## 🔗 相关链接

- GitHub: https://github.com/qingdeng888/metapi-qing
- 分支: `dev2`
- Docker Hub: https://hub.docker.com/r/qingdeng/metapi-qing
