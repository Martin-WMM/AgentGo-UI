<script setup lang="ts">
import { IconTooltipHost, ToastHost } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, RouterView, useRoute } from 'vue-router';

import AppHeaderActions from './components/AppHeaderActions.vue';
import AppSidebar from './components/AppSidebar.vue';
import { useSidebar } from './composables/useSidebar';
import { useTheme } from './composables/useTheme';
import { useWorkspaces } from './composables/useWorkspaces';
import {
  consoleFooterNavItems,
  consoleNavItems,
  isResourcePath,
  resourceCatalog,
} from './navigation';
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
  const items = [{ label: t('console.title'), to: undefined as string | undefined }];
  const resource = resourceCatalog.find(
    (item) => route.path === item.to || route.path.startsWith(`${item.to}/`),
  );
  if (resource || isResourcePath(route.path)) {
    items.push({ label: t('console.items.resources'), to: '/console/resources' });
    if (resource) items.push({ label: t(`console.items.${resource.key}`), to: resource.to });
  } else {
    const navItem = [...consoleNavItems, ...consoleFooterNavItems].find(
      (item) => route.path === item.to || route.path.startsWith(`${item.to}/`),
    );
    if (!navItem) return [];
    items.push({ label: t(`console.items.${navItem.key}`), to: navItem.to });
  }
  if (route.name === 'workspace-files') {
    const workspace = getWorkspace(String(route.params.workspaceId));
    items.push({ label: workspace?.name || t('files.notFound'), to: undefined });
  }
  if (route.name === 'workspace-create') {
    items.push({ label: t('files.createWorkspace'), to: undefined });
  }
  if (route.name === 'workspace-edit') {
    items.push({ label: t('files.editWorkspace'), to: undefined });
  }
  if (route.name === 'model-create') {
    items.push({ label: t('models.createModel'), to: undefined });
  }
  if (route.name === 'model-edit') {
    items.push({ label: t('models.editModel'), to: undefined });
  }
  if (route.name === 'mcp-server-create') {
    items.push({ label: t('mcp.createServer'), to: undefined });
  }
  if (route.name === 'mcp-server-edit') {
    items.push({ label: t('mcp.editServer'), to: undefined });
  }
  if (route.name === 'a2a-agent-create') {
    items.push({ label: t('a2a.createAgent'), to: undefined });
  }
  if (route.name === 'a2a-agent-edit') {
    items.push({ label: t('a2a.editAgent'), to: undefined });
  }
  if (route.name === 'prompt-template-create') {
    items.push({ label: t('prompts.createTemplate'), to: undefined });
  }
  if (route.name === 'prompt-template-history') {
    items.push({ label: t('prompts.history'), to: undefined });
  }
  if (route.name === 'prompt-template-edit') {
    items.push({ label: t('prompts.editTemplate'), to: undefined });
  }
  if (route.name === 'prompt-template-view') {
    items.push({ label: t('prompts.viewTemplate'), to: undefined });
  }
  return items;
});
</script>

<template>
  <div class="flex min-h-dvh w-full min-w-0 max-w-full text-foreground">
    <AppSidebar v-if="showAppShell" />
    <div class="flex w-full min-w-0 max-w-full flex-1 flex-col">
      <header
        class="sticky top-0 z-30 w-full min-w-0 border-b border-input/60 bg-background/75 shadow-[0_10px_30px_-24px] shadow-foreground/40 backdrop-blur-xl dark:border-info/20 dark:bg-background/80 dark:shadow-black/70"
      >
        <div class="flex h-16 w-full min-w-0 items-center gap-3 px-4 sm:px-6">
          <button
            v-if="showAppShell"
            type="button"
            class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
            :aria-label="t('console.open')"
            @click="openMobile"
          >
            <Icon icon="lucide:panel-left" width="18" height="18" aria-hidden="true" />
          </button>
          <RouterLink to="/" class="flex min-w-0 items-center gap-3" :aria-label="t('brand')">
            <span
              class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent"
            >
              <img :src="logoSource" alt="" class="size-16 max-w-none object-cover" />
            </span>
            <span class="hidden min-w-0 sm:block">
              <span class="block truncate text-sm font-semibold tracking-tight">{{
                t('brand')
              }}</span>
              <span class="block truncate text-xs text-muted-foreground">{{
                t('brandTagline')
              }}</span>
            </span>
          </RouterLink>
          <AppHeaderActions />
        </div>
      </header>
      <nav
        v-if="showAppShell && breadcrumbs.length"
        class="flex h-14 w-full min-w-0 items-center border-b border-input/60 bg-background/55 px-4 backdrop-blur sm:px-6"
        :aria-label="t('console.label')"
      >
        <ol class="flex min-w-0 items-center gap-2 text-sm">
          <li
            v-for="(crumb, index) in breadcrumbs"
            :key="`${crumb.label}-${index}`"
            class="flex min-w-0 items-center gap-2"
          >
            <Icon
              v-if="index"
              icon="lucide:chevron-right"
              class="shrink-0 text-muted-foreground/70"
              width="15"
              height="15"
              aria-hidden="true"
            />
            <RouterLink
              v-if="crumb.to && index < breadcrumbs.length - 1"
              :to="crumb.to"
              class="truncate text-muted-foreground transition-colors hover:text-foreground"
            >
              {{ crumb.label }}
            </RouterLink>
            <span
              v-else
              class="truncate"
              :class="
                index === breadcrumbs.length - 1
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'
              "
              :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined"
              >{{ crumb.label }}</span
            >
          </li>
        </ol>
      </nav>
      <main class="w-full min-w-0 max-w-full flex-1">
        <RouterView v-slot="{ Component, route: current }">
          <Transition name="ag-page" mode="out-in">
            <component :is="Component" :key="current.path" />
          </Transition>
        </RouterView>
      </main>
      <footer class="border-t border-input/60 bg-background/70 backdrop-blur">
        <div
          class="flex w-full min-w-0 flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6"
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
    <ToastHost :dismiss-label="t('toast.dismiss')" :region-label="t('toast.region')" />
    <IconTooltipHost />
  </div>
</template>
