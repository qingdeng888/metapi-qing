import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { toPersistenceJson } from './downstreamApiKeyService.js';

/**
 * 自动同步下游密钥的路由模型
 * 查询所有启用了 autoSyncRoutes 的密钥，并更新它们的模型和群组路由
 */
export async function syncDownstreamKeysWithRoutes(): Promise<{ synced: number }> {
  // 查询所有启用了自动同步的密钥
  const keysToSync = await db.select()
    .from(schema.downstreamApiKeys)
    .where(eq(schema.downstreamApiKeys.autoSyncRoutes, true))
    .all();

  if (keysToSync.length === 0) {
    return { synced: 0 };
  }

  // 查询所有可用的路由
  const allRoutes = await db.select({
    id: schema.tokenRoutes.id,
    modelPattern: schema.tokenRoutes.modelPattern,
    routeMode: schema.tokenRoutes.routeMode,
  })
    .from(schema.tokenRoutes)
    .where(eq(schema.tokenRoutes.enabled, true))
    .all();

  // 分离精确模型和群组路由
  const exactModels: string[] = [];
  const groupRouteIds: number[] = [];

  for (const route of allRoutes) {
    if (isExactModelPattern(route.modelPattern)) {
      exactModels.push(route.modelPattern);
    } else {
      groupRouteIds.push(route.id);
    }
  }

  // 去重
  const uniqueModels = Array.from(new Set(exactModels)).sort();
  const uniqueGroupRouteIds = Array.from(new Set(groupRouteIds)).sort();

  // 更新所有需要同步的密钥
  const nowIso = new Date().toISOString();
  let syncedCount = 0;

  for (const key of keysToSync) {
    await db.update(schema.downstreamApiKeys)
      .set({
        supportedModels: toPersistenceJson(uniqueModels),
        allowedRouteIds: toPersistenceJson(uniqueGroupRouteIds),
        updatedAt: nowIso,
      })
      .where(eq(schema.downstreamApiKeys.id, key.id))
      .run();

    syncedCount++;
  }

  return { synced: syncedCount };
}

/**
 * 判断是否是精确模型模式
 */
function isExactModelPattern(modelPattern: string): boolean {
  const normalized = modelPattern.trim();
  if (!normalized) return false;
  if (normalized.toLowerCase().startsWith('re:')) return false;
  return !/[\*\?]/.test(normalized);
}
