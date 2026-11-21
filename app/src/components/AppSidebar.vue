<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { onBeforeUnmount, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute } from 'vue-router';

import { useSidebar } from '../composables/useSidebar';
import { consoleFooterNavItems, consoleNavItems, isResourcePath } from '../navigation';
import { useSettingsStore } from '../stores/settings';

const { t } = useI18n();
const route = useRoute();
const { collapsed, mobileOpen, closeMobile } = useSidebar();
const settings = useSettingsStore();
const navSections = [
  {
    key: 'primary',
    items: consoleNavItems,
    className: 'min-h-0 flex-1 space-y-1 overflow-y-auto',
  },
  {
    key: 'footer',
    items: consoleFooterNavItems,
    className: 'mt-2 shrink-0 space-y-1 border-t border-input/70 pt-2',
  },
];

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMobile();
}

onMounted(() => document.addEventListener('keydown', onKeyDown));
onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown));

function isActive(path: string) {
  if (path === '/console/resources') return isResourcePath(route.path);
  return route.path === path || route.path.startsWith(`${path}/`);
}

function toggleCollapsed() {
  void settings.update({ sidebarCollapsed: !collapsed.value });
}
</script>

<template>
  <Transition name="ag-fade">
    <div v-if="mobileOpen" class="ag-backdrop md:hidden" @click="closeMobile" />
  </Transition>
  <aside
    class="ag-sidebar sticky top-0 z-50 flex h-dvh shrink-0 flex-col self-start overflow-hidden border-r"
    :class="mobileOpen ? 'ag-sidebar--drawer fixed inset-y-0 left-0 flex' : 'hidden md:flex'"
    :data-collapsed="collapsed && !mobileOpen"
  >
    <div class="ag-sidebar-head">
      <p class="ag-sidebar-label text-sm font-semibold">{{ t('console.title') }}</p>
      <div class="flex items-center gap-0.5">
        <RouterLink
          to="/"
          class="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          :aria-label="t('console.newConversation')"
          :title="t('console.newConversation')"
          @click="closeMobile"
        >
          <Icon icon="lucide:square-pen" width="18" height="18" aria-hidden="true" />
        </RouterLink>
        <button
          type="button"
          class="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          :aria-label="collapsed ? t('console.expand') : t('console.collapse')"
          :aria-expanded="!collapsed"
          :title="collapsed ? t('console.expand') : t('console.collapse')"
          @click="toggleCollapsed"
        >
          <Transition name="ag-pop" mode="out-in">
            <Icon
              :key="collapsed ? 'expand' : 'collapse'"
              :icon="collapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'"
              width="18"
              height="18"
              aria-hidden="true"
            />
          </Transition>
        </button>
      </div>
    </div>
    <nav class="flex min-h-0 flex-1 flex-col overflow-hidden p-2" :aria-label="t('console.label')">
      <div v-for="section in navSections" :key="section.key" :class="section.className">
        <RouterLink
          v-for="item in section.items"
          :key="item.key"
          :to="item.to"
          class="ag-nav-link"
          :class="{ 'ag-nav-link--active': isActive(item.to) }"
          :title="collapsed ? t(`console.items.${item.key}`) : undefined"
          @click="closeMobile"
        >
          <Icon :icon="item.icon" width="18" height="18" class="shrink-0" aria-hidden="true" />
          <span class="ag-sidebar-label">{{ t(`console.items.${item.key}`) }}</span>
        </RouterLink>
      </div>
    </nav>
  </aside>
</template>
