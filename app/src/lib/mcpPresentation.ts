import type { McpServerStatus } from '../composables/useMcpServers';

/** Visual treatment for an MCP server connectivity status on a card. */
export interface McpPresentation {
  color: string;
  icon: string;
}

const presentations: Record<McpServerStatus, McpPresentation> = {
  CONNECTED: { color: '#059669', icon: 'lucide:plug-zap' },
  DISCONNECTED: { color: '#64748b', icon: 'lucide:unplug' },
  ERROR: { color: '#dc2626', icon: 'lucide:triangle-alert' },
  UNKNOWN: { color: '#0ea5e9', icon: 'lucide:server' },
};

/**
 * Returns the icon and accent color used to present an MCP server status.
 *
 * @param status connectivity status
 * @returns presentation tokens for cards and badges
 */
export function mcpPresentation(status: McpServerStatus): McpPresentation {
  return presentations[status];
}
