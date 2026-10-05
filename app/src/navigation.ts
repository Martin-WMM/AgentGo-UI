export interface ConsoleNavItem {
  key:
    'settings' | 'files' | 'models' | 'connections' | 'mcp' | 'skills' | 'a2a' | 'prompts' | 'apis';
  to: string;
  icon: string;
}

export const consoleNavItems: ConsoleNavItem[] = [
  { key: 'settings', to: '/console/settings', icon: 'lucide:settings-2' },
  { key: 'files', to: '/console/files', icon: 'lucide:folder' },
  { key: 'models', to: '/console/models', icon: 'lucide:brain' },
  { key: 'connections', to: '/console/connections', icon: 'lucide:database' },
  { key: 'mcp', to: '/console/mcp', icon: 'lucide:server' },
  { key: 'skills', to: '/console/skills', icon: 'lucide:sparkles' },
  { key: 'a2a', to: '/console/a2a', icon: 'lucide:bot' },
  { key: 'prompts', to: '/console/prompts', icon: 'lucide:message-square-text' },
  { key: 'apis', to: '/console/apis', icon: 'lucide:braces' },
];
