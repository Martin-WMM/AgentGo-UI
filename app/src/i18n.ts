import { createI18n } from 'vue-i18n';

export const supportedLocales = ['en', 'zh-CN'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

const messages = {
  en: {
    brand: 'AgentGo',
    brandTagline: 'Your agent workspace',
    navigation: {
      label: 'Primary navigation',
      home: 'Home',
      chat: 'Chat',
      settings: 'Settings',
      docs: 'Docs',
    },

    console: {
      title: 'Control panel',
      label: 'Workspace control panel',
      open: 'Open control panel',
      collapse: 'Collapse control panel',
      expand: 'Expand control panel',
      newConversation: 'Start a new conversation',
      placeholder: 'This panel is a UI shell for now. Backend integration will follow later.',
      items: {
        settings: 'AgentGo configuration',
        files: 'File management',
        models: 'Model management',
        connections: 'Data connection management',
        mcp: 'MCP server management',
        skills: 'Skills management',
        a2a: 'A2A sub-agent management',
        prompts: 'Prompt management',
        apis: 'API management',
      },
    },
    language: { label: 'Switch language' },
    theme: { light: 'Switch to light mode', dark: 'Switch to dark mode' },
    toast: {
      dismiss: 'Dismiss notification',
      region: 'Notifications',
