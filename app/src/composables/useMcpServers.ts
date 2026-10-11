import { computed, ref } from 'vue';

import { FileRequestError, apiData, apiRequest } from '../api/fileRequest';

/** Connectivity statuses returned by `/api/v1/mcpServers`. */
export const mcpServerStatuses = ['UNKNOWN', 'CONNECTED', 'DISCONNECTED', 'ERROR'] as const;

export type McpServerStatus = (typeof mcpServerStatuses)[number];

/** Outbound auth modes for Streamable HTTP MCP servers. */
export const mcpAuthTypes = ['NONE', 'BEARER', 'HEADER'] as const;

export type McpAuthType = (typeof mcpAuthTypes)[number];

/** Tool summary cached from MCP tools/list. */
export interface McpToolSummary {
  name: string;
  description: string;
}

/** User-owned MCP Streamable HTTP server returned by the API. */
export interface ManagedMcpServer {
  id: string;
  name: string;
  transport: 'STREAMABLE_HTTP';
  endpointUrl: string;
  authType: McpAuthType;
  authToken: string;
  authHeaderName: string;
  customHeaders: Record<string, string>;
  protocolVersion: string;
  enabled: boolean;
  status: McpServerStatus;
  remoteServerName: string;
  remoteServerVersion: string;
  serverCapabilities: Record<string, unknown>;
  tools: McpToolSummary[];
  lastConnectedAt: string | null;
  lastError: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/** Fields sent when creating or replacing an MCP server. */
export interface McpServerInput {
  name: string;
  endpointUrl: string;
  authType: McpAuthType;
  authToken: string;
  authHeaderName: string;
  customHeaders: Record<string, string>;
  protocolVersion: string;
  enabled: boolean;
  description: string;
}

interface McpServerDto {
  id: string;
  name: string;
  transport: 'STREAMABLE_HTTP';
  endpointUrl: string;
  authType: McpAuthType;
  authToken?: string | null;
  authHeaderName?: string | null;
  customHeaders?: Record<string, string> | null;
  protocolVersion?: string | null;
  enabled: boolean;
  status: McpServerStatus;
  remoteServerName?: string | null;
  remoteServerVersion?: string | null;
  serverCapabilities?: Record<string, unknown> | null;
  tools?: Array<{ name?: string | null; description?: string | null }> | null;
  lastConnectedAt?: string | null;
  lastError?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

const servers = ref<ManagedMcpServer[]>([]);

function toServer(dto: McpServerDto): ManagedMcpServer {
  return {
    id: dto.id,
    name: dto.name,
    transport: 'STREAMABLE_HTTP',
    endpointUrl: dto.endpointUrl,
    authType: dto.authType,
    authToken: dto.authToken?.trim() ?? '',
    authHeaderName: dto.authHeaderName?.trim() ?? '',
    customHeaders: dto.customHeaders ?? {},
    protocolVersion: dto.protocolVersion?.trim() ?? '2025-03-26',
    enabled: dto.enabled,
    status: dto.status,
    remoteServerName: dto.remoteServerName?.trim() ?? '',
    remoteServerVersion: dto.remoteServerVersion?.trim() ?? '',
    serverCapabilities: dto.serverCapabilities ?? {},
    tools: (dto.tools ?? [])
      .map((tool) => ({
        name: tool.name?.trim() ?? '',
        description: tool.description?.trim() ?? '',
      }))
      .filter((tool) => tool.name.length > 0),
    lastConnectedAt: dto.lastConnectedAt ?? null,
    lastError: dto.lastError?.trim() ?? '',
    description: dto.description?.trim() ?? '',
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function requestBody(input: McpServerInput) {
  return {
    name: input.name.trim(),
    transport: 'STREAMABLE_HTTP',
    endpointUrl: input.endpointUrl.trim(),
    authType: input.authType,
    authToken: input.authToken.trim() || null,
    authHeaderName: input.authHeaderName.trim() || null,
    customHeaders: input.customHeaders,
    protocolVersion: input.protocolVersion.trim() || '2025-03-26',
    enabled: input.enabled,
    description: input.description.trim() || null,
  };
}

/**
 * Maps an MCP servers API failure onto an i18n message key.
 *
 * @param caught error thrown by the shared API client
 * @param action whether the failure happened while loading, saving, or probing
 * @returns catalog key under `mcp`
 */
export function mcpFailureI18n(
  caught: unknown,
  action: 'load' | 'save' | 'probe' = 'save',
): string {
  if (!(caught instanceof FileRequestError)) {
    if (action === 'load') return 'mcp.loadError';
    if (action === 'probe') return 'mcp.probeError';
    return 'mcp.saveError';
  }
  if (caught.errorCode === 'MCP-001' || caught.status === 404) return 'mcp.notFound';
  if (caught.errorCode === 'MCP-002' || caught.status === 400) return 'mcp.invalid';
  if (caught.errorCode === 'MCP-003' || caught.status === 409) return 'mcp.duplicateName';
  if (caught.errorCode === 'MCP-004' || caught.status === 403) return 'mcp.forbidden';
  if (caught.errorCode === 'MCP-006' || caught.status === 502) return 'mcp.probeError';
  if (caught.errorCode === 'AUTH-002' || caught.status === 401) return 'mcp.authError';
  if (action === 'load') return 'mcp.loadError';
  if (action === 'probe') return 'mcp.probeError';
  return 'mcp.saveError';
}

/** Loads and mutates the signed-in user's MCP Streamable HTTP servers. */
export function useMcpServers() {
  const sortedServers = computed(() =>
    [...servers.value].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  );

  async function refreshServers() {
    const data = await apiData<McpServerDto[]>('/api/v1/mcpServers');
    servers.value = data.map(toServer);
  }

  async function createServer(input: McpServerInput) {
    const created = await apiData<McpServerDto>('/api/v1/mcpServers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody(input)),
    });
    const server = toServer(created);
    servers.value = [server, ...servers.value.filter((item) => item.id !== server.id)];
    return server;
  }

  async function updateServer(id: string, input: McpServerInput) {
    const updated = await apiData<McpServerDto>(`/api/v1/mcpServers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody(input)),
    });
    const server = toServer(updated);
    servers.value = servers.value.map((item) => (item.id === id ? server : item));
    return server;
  }

  async function removeServer(id: string) {
    await apiRequest(`/api/v1/mcpServers/${encodeURIComponent(id)}`, { method: 'DELETE' });
    servers.value = servers.value.filter((item) => item.id !== id);
  }

  async function probeServer(id: string) {
    const probed = await apiData<McpServerDto>(
      `/api/v1/mcpServers/${encodeURIComponent(id)}/probe`,
      { method: 'POST' },
    );
    const server = toServer(probed);
    servers.value = servers.value.map((item) => (item.id === id ? server : item));
    return server;
  }

  return {
    servers: sortedServers,
    refreshServers,
    createServer,
    updateServer,
    removeServer,
    probeServer,
  };
}
