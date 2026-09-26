import { createI18n } from 'vue-i18n';

export const supportedLocales = ['en', 'zh-CN'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

const messages = {
  en: {
    brand: 'AgentGo',
    brandTagline: 'Your agent workspace',
    navigation: { label: 'Primary navigation', home: 'Home', chat: 'Chat', settings: 'Settings' },
    language: { label: 'Switch language' },
    theme: { light: 'Switch to light mode', dark: 'Switch to dark mode' },
    user: { menu: 'Open user menu', signedInAs: 'Signed in as' },
    footer: {
      rights: 'All rights reserved.',
      privacy: 'Privacy',
      terms: 'Terms',
      backend: 'Backend',
    },
    home: {
      eyebrow: 'Your AI workspace',
      title: 'How can I help you today?',
      description:
        'Ask questions, explore ideas, and turn your next goal into action with AgentGo.',
      placeholder: 'Message AgentGo...',
      send: 'Send message',
      attach: 'Attach a file',
      voice: 'Start voice input',
      suggestions: ['Plan a project', 'Summarize a document', 'Explore an idea'],
    },
    chat: {
      title: 'New conversation',
      description: 'Start a focused conversation with your AgentGo assistant.',
    },
    settings: {
      title: 'Basic settings',
      description: 'Manage your workspace preferences and connected services.',
    },
  },
  'zh-CN': {
    brand: 'AgentGo',
    brandTagline: '你的智能体工作空间',
    navigation: { label: '主导航', home: '首页', chat: '对话', settings: '设置' },
    language: { label: '切换语言' },
    theme: { light: '切换到浅色模式', dark: '切换到深色模式' },
    user: { menu: '打开用户菜单', signedInAs: '当前登录用户' },
    footer: {
      rights: '保留所有权利。',
      privacy: '隐私政策',
      terms: '服务条款',
      backend: '后端项目',
    },
    home: {
      eyebrow: '你的智能体工作空间',
      title: '今天我可以如何帮助你？',
      description: '向 AgentGo 提问、探索想法，并将下一个目标转化为行动。',
      placeholder: '给 AgentGo 发消息……',
      send: '发送消息',
      attach: '添加文件',
      voice: '开始语音输入',
      suggestions: ['规划一个项目', '总结一份文档', '探索一个想法'],
    },
    chat: { title: '新对话', description: '与 AgentGo 助手开始一次专注的对话。' },
    settings: { title: '基本设置', description: '管理工作空间偏好和已连接的服务。' },
  },
} as const;

function getInitialLocale(): SupportedLocale {
  const storedLocale = localStorage.getItem('agentgo-locale');
  if (storedLocale === 'zh-CN' || storedLocale === 'en') return storedLocale;
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages,
});
