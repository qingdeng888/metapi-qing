import { startBackgroundTask } from './backgroundTaskService.js';
import {
  rebuildTokenRoutesFromAvailability,
  refreshModelsAndRebuildRoutes as refreshModelsAndRebuildRoutesViaModelService,
} from './modelService.js';
import { syncDownstreamKeysWithRoutes } from './downstreamKeySyncService.js';

export async function rebuildRoutesOnly() {
  const result = await rebuildTokenRoutesFromAvailability();

  // 路由重建后，自动同步所有启用自动同步的下游密钥
  syncDownstreamKeysWithRoutes().catch((error) => {
    console.error('[rebuildRoutesOnly] Failed to sync downstream keys:', error);
  });

  return result;
}

export async function rebuildRoutesBestEffort() {
  try {
    await rebuildRoutesOnly();
    return true;
  } catch {
    return false;
  }
}

export async function refreshModelsAndRebuildRoutes() {
  return refreshModelsAndRebuildRoutesViaModelService();
}

export function queueRefreshModelsAndRebuildRoutesTask(input: {
  type: string;
  title: string;
  dedupeKey?: string;
  notifyOnFailure?: boolean;
  successMessage: (currentTask: { result?: unknown }) => string;
  failureMessage: (currentTask: { error?: string | null }) => string;
}) {
  return startBackgroundTask(
    {
      type: input.type,
      title: input.title,
      dedupeKey: input.dedupeKey || 'refresh-models-and-rebuild-routes',
      notifyOnFailure: input.notifyOnFailure ?? true,
      successMessage: input.successMessage,
      failureMessage: input.failureMessage,
    },
    async () => refreshModelsAndRebuildRoutes(),
  );
}
