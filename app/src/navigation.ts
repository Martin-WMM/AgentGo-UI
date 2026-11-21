export type ResourceKey =
  'files' | 'models' | 'connections' | 'mcp' | 'skills' | 'a2a' | 'prompts' | 'apis';

export interface ConsoleNavItem {
  key: 'settings' | 'resources' | 'eventLogs';
  to: string;
  icon: string;
}

export interface ResourceCatalogItem {
  key: ResourceKey;
  to: string;
  icon: string;
  color: string;
}

export const consoleNavItems: ConsoleNavItem[] = [
  { key: 'settings', to: '/console/settings', icon: 'lucide:settings-2' },
  { key: 'resources', to: '/console/resources', icon: 'lucide:blocks' },
];

/** Pinned to the bottom of the control-panel sidebar. */
export const consoleFooterNavItems: ConsoleNavItem[] = [
  { key: 'eventLogs', to: '/console/events', icon: 'lucide:scroll-text' },
];

export const resourceCatalog: ResourceCatalogItem[] = [
  { key: 'files', to: '/console/files', icon: 'lucide:folder', color: '#2563eb' },
  { key: 'models', to: '/console/models', icon: 'lucide:brain', color: '#4f46e5' },
  { key: 'connections', to: '/console/connections', icon: 'lucide:database', color: '#0891b2' },
  { key: 'mcp', to: '/console/mcp', icon: 'lucide:server', color: '#0f766e' },
  { key: 'skills', to: '/console/skills', icon: 'lucide:sparkles', color: '#d97706' },
  { key: 'a2a', to: '/console/a2a', icon: 'lucide:bot', color: '#7c3aed' },
  { key: 'prompts', to: '/console/prompts', icon: 'lucide:message-square-text', color: '#db2777' },
  { key: 'apis', to: '/console/apis', icon: 'lucide:braces', color: '#64748b' },
];

/** True when the control-panel path belongs to the resource catalog or one of its detail pages. */
export function isResourcePath(path: string): boolean {
  if (path === '/console/resources' || path.startsWith('/console/resources/')) return true;
  return resourceCatalog.some((item) => path === item.to || path.startsWith(`${item.to}/`));
}
