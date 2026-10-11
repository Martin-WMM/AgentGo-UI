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
