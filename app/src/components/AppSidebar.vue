<script setup lang="ts">
import { toastError } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { onBeforeUnmount, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { useChatSessions } from '../composables/useChatSessions';
import { useSidebar } from '../composables/useSidebar';
import { consoleFooterNavItems, consoleNavItems, isResourcePath } from '../navigation';
import { useAuthStore } from '../stores/auth';
import { useSettingsStore } from '../stores/settings';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { collapsed, mobileOpen, closeMobile } = useSidebar();
const settings = useSettingsStore();
const { sessions, ensureLoaded, create, remove } = useChatSessions();
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

onMounted(() => {
  document.addEventListener('keydown', onKeyDown);
  if (auth.isAuthenticated) void ensureLoaded();
});
onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown));

function isActive(path: string) {
  if (path === '/console/resources') return isResourcePath(route.path);
  return route.path === path || route.path.startsWith(`${path}/`);
}

function isSessionActive(id: number) {
  return route.name === 'chat-session' && String(route.params.sessionId) === String(id);
}

function toggleCollapsed() {
  void settings.update({ sidebarCollapsed: !collapsed.value });
}

async function onNewChat() {
  try {
    const created = await create();
    closeMobile();
    await router.push({ name: 'chat-session', params: { sessionId: String(created.id) } });
  } catch {
    toastError(t('chat.sessionCreateError'), t('toast.error'));
  }
}

async function onDeleteSession(id: number, event: Event) {
  event.preventDefault();
  event.stopPropagation();
  try {
    await remove(id);
    if (isSessionActive(id)) {
      await router.push({ name: 'chat' });
    }
  } catch {
    toastError(t('chat.sessionDeleteError'), t('toast.error'));
  }
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
        <button
          type="button"
          class="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          :aria-label="t('console.newConversation')"
          :title="t('console.newConversation')"
          @click="onNewChat"
        >
          <Icon icon="lucide:square-pen" width="18" height="18" aria-hidden="true" />
        </button>
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
    <div
      v-if="auth.isAuthenticated"
      class="min-h-0 flex-1 space-y-1 overflow-y-auto border-b border-input/70 p-2"
      :aria-label="t('chat.sessions')"
    >
      <p
        v-if="!collapsed && sessions.length === 0"
        class="ag-sidebar-label px-2 py-1.5 text-xs text-muted-foreground"
      >
        {{ t('chat.sessionsEmpty') }}
      </p>
      <RouterLink
        v-for="item in sessions"
        :key="item.id"
        :to="{ name: 'chat-session', params: { sessionId: String(item.id) } }"
        class="ag-nav-link group"
        :class="{ 'ag-nav-link--active': isSessionActive(item.id) }"
        :title="collapsed ? item.title : undefined"
        @click="closeMobile"
      >
        <Icon
          icon="lucide:message-square"
          width="18"
          height="18"
          class="shrink-0"
          aria-hidden="true"
        />
        <span class="ag-sidebar-label min-w-0 flex-1 truncate">{{ item.title }}</span>
        <button
          v-if="!collapsed"
          type="button"
          class="rounded p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
          :aria-label="t('chat.sessionDelete')"
          :title="t('chat.sessionDelete')"
          @click="onDeleteSession(item.id, $event)"
        >
          <Icon icon="lucide:trash-2" width="14" height="14" aria-hidden="true" />
        </button>
      </RouterLink>
    </div>
    <nav
      class="flex min-h-0 shrink-0 flex-col overflow-hidden p-2"
      :aria-label="t('console.label')"
    >
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
