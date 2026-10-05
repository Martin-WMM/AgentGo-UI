<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { onBeforeUnmount, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute } from 'vue-router';

import { useSidebar } from '../composables/useSidebar';
import { consoleNavItems } from '../navigation';

const { t } = useI18n();
const route = useRoute();
const { collapsed, mobileOpen, toggleCollapsed, closeMobile } = useSidebar();

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMobile();
}

onMounted(() => document.addEventListener('keydown', onKeyDown));
onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown));

function isActive(path: string) {
  return route.path === path;
}
</script>

<template>
  <div v-if="mobileOpen" class="fixed inset-0 z-40 bg-black/40 md:hidden" @click="closeMobile" />
  <aside
    class="z-50 flex shrink-0 flex-col overflow-hidden border-r border-input/70 bg-background transition-[width] duration-200"
    :class="[mobileOpen ? 'fixed inset-y-0 left-0 flex' : 'hidden md:flex']"
    :style="{ width: collapsed ? '4rem' : '16rem' }"
  >
    <div
      class="flex h-16 items-center border-b border-input/70"
      :class="collapsed ? 'justify-center gap-1 px-1' : 'justify-between px-3'"
    >
      <p v-if="!collapsed" class="truncate text-sm font-semibold">{{ t('console.title') }}</p>
      <div class="flex items-center gap-1">
        <RouterLink
          to="/"
          class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          :aria-label="t('console.newConversation')"
          :title="t('console.newConversation')"
          @click="closeMobile"
        >
          <Icon icon="lucide:square-pen" width="18" height="18" aria-hidden="true" />
        </RouterLink>
        <button
          type="button"
          class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          :aria-label="collapsed ? t('console.expand') : t('console.collapse')"
          :aria-expanded="!collapsed"
          @click="toggleCollapsed"
        >
          <Icon
            :icon="collapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'"
            width="18"
            height="18"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
    <nav class="flex-1 space-y-1 overflow-y-auto p-2" :aria-label="t('console.label')">
      <RouterLink
        v-for="item in consoleNavItems"
        :key="item.key"
        :to="item.to"
        class="flex items-center rounded-lg py-2 text-sm transition-colors hover:bg-accent"
        :class="[
          collapsed ? 'justify-center px-0' : 'gap-3 px-2.5',
          isActive(item.to)
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:text-foreground',
        ]"
        :title="collapsed ? t(`console.items.${item.key}`) : undefined"
        @click="closeMobile"
      >
        <Icon :icon="item.icon" width="18" height="18" class="shrink-0" aria-hidden="true" />
        <span v-if="!collapsed" class="truncate">{{ t(`console.items.${item.key}`) }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>
