# 下游密钥自动同步路由功能

## 功能说明

此功能允许下游密钥（Downstream API Keys）自动同步所有路由中的模型和群组，无需手动更新。

## 使用场景

当你的路由配置经常变化（添加新模型、删除旧模型、更新群组等），手动更新每个下游密钥会非常繁琐。启用此功能后：

- ✅ 路由添加新模型 → 自动同步到密钥
- ✅ 路由删除模型 → 自动从密钥移除
- ✅ 路由启用/禁用 → 自动更新密钥
- ✅ 群组路由变化 → 自动同步到密钥

## 如何使用

### 1. 编辑下游密钥

进入下游密钥管理页面，点击编辑密钥。

### 2. 展开高级配置

在编辑界面中，找到"高级配置"部分并展开。

### 3. 启用自动同步

勾选"自动同步路由模型"选项：

```
☑️ 自动同步路由模型
```

**说明：** 启用后，此密钥将自动同步所有路由中的模型和群组，无需手动更新。当路由添加或删除模型时，会自动更新到此密钥。

⚠️ **注意：** 已启用自动同步，下方的模型白名单和群组范围设置将被忽略。

### 4. 保存设置

点击保存按钮，密钥将立即同步当前所有启用的路由模型。

## 工作原理

### 触发时机

自动同步会在以下操作后触发：

1. **创建新路由** - 新路由的模型会自动添加到所有启用自动同步的密钥
2. **更新路由** - 路由的模型变化会自动同步到密钥
3. **删除路由** - 删除的模型会自动从密钥移除
4. **批量启用/禁用路由** - 路由状态变化会自动同步

### 同步内容

- **精确模型（Exact Models）**：所有匹配精确模型模式的路由
- **群组路由（Group Routes）**：所有包含通配符、正则表达式的路由

### 数据库变更

添加了新字段：
- `downstream_api_keys.auto_sync_routes` (BOOLEAN) - 是否启用自动同步

## 技术实现

### 前端变更

1. **表单字段**：`DownstreamKeyEditorForm.autoSyncRoutes`
2. **UI组件**：在高级配置区域添加勾选框
3. **提示信息**：启用后显示警告，说明手动配置将被忽略

### 后端变更

1. **数据库 Schema**：`schema.downstreamApiKeys.autoSyncRoutes`
2. **API Payload**：支持 `autoSyncRoutes` 参数
3. **同步服务**：`downstreamKeySyncService.ts`
4. **触发点**：路由创建/更新/删除/批量操作后自动触发

### 同步逻辑

```typescript
// 查询所有启用自动同步的密钥
const keysToSync = await db.select()
  .from(schema.downstreamApiKeys)
  .where(eq(schema.downstreamApiKeys.autoSyncRoutes, true))
  .all();

// 查询所有启用的路由
const allRoutes = await db.select()
  .from(schema.tokenRoutes)
  .where(eq(schema.tokenRoutes.enabled, true))
  .all();

// 分离精确模型和群组路由
const exactModels = []; // 精确模型列表
const groupRouteIds = []; // 群组路由ID列表

// 更新所有启用自动同步的密钥
await db.update(schema.downstreamApiKeys)
  .set({
    supportedModels: JSON.stringify(exactModels),
    allowedRouteIds: JSON.stringify(groupRouteIds),
    updatedAt: new Date().toISOString(),
  })
  .where(eq(schema.downstreamApiKeys.id, key.id));
```

## 注意事项

1. **性能考虑**：同步操作在后台异步执行，不会阻塞路由更新操作
2. **错误处理**：同步失败不会影响路由操作，错误会记录到控制台
3. **手动配置**：启用自动同步后，手动配置的模型白名单和群组范围会被自动同步覆盖
4. **禁用自动同步**：取消勾选后，密钥会保留当前的模型配置，但不再自动更新

## 迁移文件

```sql
-- drizzle/0028_downstream_auto_sync_routes.sql
ALTER TABLE downstream_api_keys ADD COLUMN auto_sync_routes INTEGER DEFAULT 0;
```

## 相关文件

- `src/server/db/schema.ts` - 数据库 Schema 定义
- `src/server/services/downstreamKeySyncService.ts` - 同步服务
- `src/server/routes/api/downstreamApiKeys.ts` - 下游密钥 API
- `src/server/routes/api/tokens.ts` - 路由 API（触发同步）
- `src/web/pages/downstream-keys/DownstreamKeyEditorModal.tsx` - 编辑界面
- `src/web/pages/DownstreamKeys.tsx` - 主页面
- `src/server/contracts/downstreamApiKeyRoutePayloads.ts` - API Payload 定义
