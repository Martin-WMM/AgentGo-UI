<script setup lang="ts">
import { ToastHost } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, RouterView, useRoute } from 'vue-router';

import AppHeaderActions from './components/AppHeaderActions.vue';
import AppSidebar from './components/AppSidebar.vue';
import { useSidebar } from './composables/useSidebar';
import { useTheme } from './composables/useTheme';
import { useWorkspaces } from './composables/useWorkspaces';
import { consoleNavItems } from './navigation';
import { useAuthStore } from './stores/auth';

const { t } = useI18n();
const { theme } = useTheme();
const { openMobile } = useSidebar();
const { getWorkspace } = useWorkspaces();
const auth = useAuthStore();
const route = useRoute();
const isDark = computed(() => theme.value === 'dark');
const isAuthGate = computed(() => route.name === 'signed-out' || route.name === 'auth-error');
const showAppShell = computed(() => auth.isAuthenticated && !isAuthGate.value);
const logoSource = computed(() =>
  isDark.value ? '/assets/logo-dark.png' : '/assets/logo-light.png',
);
const breadcrumbs = computed(() => {
  if (!route.path.startsWith('/console')) return [];
  const navItem = consoleNavItems.find(
    (item) => route.path === item.to || route.path.startsWith(`${item.to}/`),
  );
  if (!navItem) return [];
  const items = [
    { label: t('console.title'), to: undefined as string | undefined },
    { label: t(`console.items.${navItem.key}`), to: navItem.to },
  ];
  if (route.name === 'workspace-files') {
    const workspace = getWorkspace(String(route.params.workspaceId));
    items.push({ label: workspace?.name || t('files.notFound'), to: undefined });
  }
  if (route.name === 'prompt-template-create') {
    items.push({ label: t('prompts.createTemplate'), to: undefined });
  }
  if (route.name === 'prompt-template-edit') {
    items.push({ label: t('prompts.editTemplate'), to: undefined });
  }
  return items;
});
</script>

<template>
  <div class="flex min-h-screen bg-background text-foreground">
    <AppSidebar v-if="showAppShell" />
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="sticky top-0 z-30 border-b border-input/70 bg-background/90 backdrop-blur">
        <div class="flex h-16 w-full items-center gap-3 px-4 sm:px-6">
          <button
            v-if="showAppShell"
            type="button"
          class="flex w-full flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <p>© {{ new Date().getFullYear() }} AgentGo. {{ t('footer.rights') }}</p>
          <div class="flex gap-4">
            <a href="#" class="transition-colors hover:text-foreground">{{
              t('footer.privacy')
            }}</a>
            <a href="#" class="transition-colors hover:text-foreground">{{ t('footer.terms') }}</a>
            <a
              href="https://github.com/Martin-WMM/AgentGo-backend"
              target="_blank"
              rel="noreferrer"
              class="transition-colors hover:text-foreground"
              >{{ t('footer.backend') }}</a
            >
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>
