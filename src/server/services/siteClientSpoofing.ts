/**
 * 站点客户端伪装服务
 * 为每个站点提供一键设置功能，伪装成 Codex CLI 或 Claude Code 的请求头
 */

export type ClientSpoofingMode = 'none' | 'codex' | 'claude_code';

export type SiteClientSpoofingHeaders = Record<string, string>;

/**
 * Codex CLI 标准请求头模板
 * 基于 src/server/proxy-core/cliProfiles/codexProfile.ts 的检测逻辑
 */
function getCodexSpoofingHeaders(): SiteClientSpoofingHeaders {
  return {
    'User-Agent': 'Codex/1.0.0',
    'X-Codex-Client': 'codex-cli',
    'X-Codex-Version': '1.0.0',
    'OpenAI-Beta': 'responses=compact',
  };
}

/**
 * Claude Code 标准请求头模板
 * 基于 src/server/proxy-core/cliProfiles/claudeCodeProfile.ts 的检测逻辑
 */
function getClaudeCodeSpoofingHeaders(): SiteClientSpoofingHeaders {
  return {
    'User-Agent': 'claude-cli/1.0.0',
    'X-App': 'cli',
    'Anthropic-Beta': 'max-tokens-3-5-sonnet-2024-07-15=8192',
    'Anthropic-Version': '2023-06-01',
  };
}

/**
 * 根据客户端伪装模式获取对应的请求头
 */
export function getClientSpoofingHeaders(mode: ClientSpoofingMode): SiteClientSpoofingHeaders | null {
  switch (mode) {
    case 'codex':
      return getCodexSpoofingHeaders();
    case 'claude_code':
      return getClaudeCodeSpoofingHeaders();
    case 'none':
    default:
      return null;
  }
}

/**
 * 合并站点客户端伪装请求头到实际请求头中
 * 客户端伪装请求头优先级低于显式传入的请求头
 */
export function mergeClientSpoofingHeaders(
  clientSpoofingMode: unknown,
  existingHeaders?: Record<string, string | string[]>,
): Record<string, string | string[]> {
  const mode = String(clientSpoofingMode || 'none').trim().toLowerCase() as ClientSpoofingMode;
  const spoofingHeaders = getClientSpoofingHeaders(mode);

  if (!spoofingHeaders) {
    return existingHeaders || {};
  }

  // 伪装请求头作为基础层
  const merged: Record<string, string | string[]> = { ...spoofingHeaders };

  // 现有请求头覆盖伪装请求头（保持更高优先级）
  if (existingHeaders) {
    for (const [key, value] of Object.entries(existingHeaders)) {
      merged[key] = value;
    }
  }

  return merged;
}

/**
 * 解析客户端伪装模式字符串
 */
export function parseClientSpoofingMode(input: unknown): ClientSpoofingMode {
  if (typeof input !== 'string') return 'none';
  const normalized = input.trim().toLowerCase();
  if (normalized === 'codex' || normalized === 'claude_code') {
    return normalized;
  }
  return 'none';
}

/**
 * 获取客户端伪装模式的显示名称
 */
export function getClientSpoofingDisplayName(mode: ClientSpoofingMode): string {
  switch (mode) {
    case 'codex':
      return 'Codex CLI';
    case 'claude_code':
      return 'Claude Code';
    case 'none':
    default:
      return '不伪装';
  }
}
