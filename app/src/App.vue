<script setup lang="ts">
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

const { t } = useI18n();
const { theme } = useTheme();
const { openMobile } = useSidebar();
const { getWorkspace } = useWorkspaces();
const route = useRoute();
const isDark = computed(() => theme.value === 'dark');
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
  return items;
});
</script>

<template>
  <div class="flex min-h-screen bg-background text-foreground">
    <AppSidebar />
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="sticky top-0 z-30 border-b border-input/70 bg-background/90 backdrop-blur">
        <div class="flex h-16 w-full items-center gap-3 px-4 sm:px-6">
          <button
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
        v-if="breadcrumbs.length"
        class="flex h-14 items-center border-b border-input/70 bg-background px-4 sm:px-6"
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
      <main class="flex-1"><RouterView /></main>
      <footer class="border-t border-input/70 bg-background">
        <div
          class="flex w-full flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <p>© {{ new Date().getFullYear() }} AgentGo. {{ t('footer.rights') }}</p>
          <div class="flex gap-4">
            <a href="#" class="transition-colors hover:text-foreground">{{ t('footer.privacy') }}</a>
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
