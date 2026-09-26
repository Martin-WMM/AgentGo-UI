import { createI18n } from 'vue-i18n';

export const supportedLocales = ['en', 'zh-CN'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

const messages = {
  en: {
    brand: 'AgentGo',
    hero: {
      title: 'Build and guide your agents from one focused workspace.',
      description:
        'The AgentGo UI foundation is ready with Vue 3, shadcn-style components, Tailwind CSS 4, and Iconify.',
      primaryAction: 'Get started',
      secondaryAction: 'Read the docs',
    },
    theme: {
      light: 'Switch to light mode',
      dark: 'Switch to dark mode',
    },
    language: {
      label: 'Language',
      english: 'English',
      chinese: '中文',
    },
  },
  'zh-CN': {
    brand: 'AgentGo',
    hero: {
      title: '在一个专注的工作空间中构建和管理你的智能体。',
      description:
        'AgentGo UI 已完成基础初始化，采用 Vue 3、shadcn 风格组件、Tailwind CSS 4 和 Iconify。',
      primaryAction: '开始使用',
      secondaryAction: '阅读文档',
    },
    theme: {
      light: '切换到浅色模式',
      dark: '切换到深色模式',
    },
    language: {
      label: '语言',
      english: 'English',
      chinese: '中文',
    },
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
