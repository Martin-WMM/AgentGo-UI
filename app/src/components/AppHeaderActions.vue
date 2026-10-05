<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';

import { useTheme } from '../composables/useTheme';
import { useAuthStore } from '../stores/auth';

const { locale, t } = useI18n();
const { theme, toggleTheme } = useTheme();
const auth = useAuthStore();
const userMenuOpen = ref(false);
const userMenuRoot = ref<HTMLElement | null>(null);
const isDark = computed(() => theme.value === 'dark');
const userName = computed(() => auth.user?.name || auth.user?.email || '');
const userInitials = computed(() => {
  const initials = userName.value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return initials || '?';
});

function setLocale(nextLocale: 'en' | 'zh-CN') {
  locale.value = nextLocale;
  localStorage.setItem('agentgo-locale', nextLocale);
}

function closeUserMenu() {
  userMenuOpen.value = false;
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!userMenuOpen.value) return;
  const target = event.target;
  if (target instanceof Node && userMenuRoot.value?.contains(target)) return;
  closeUserMenu();
}

function onDocumentKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeUserMenu();
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown);
  document.addEventListener('keydown', onDocumentKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown);
  document.removeEventListener('keydown', onDocumentKeyDown);
});
</script>

<template>
  <div class="ml-auto flex items-center gap-1">
    <div ref="userMenuRoot" class="relative">
      <button
        class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent"
        type="button"
        :aria-expanded="userMenuOpen"
        :aria-label="t('user.menu')"
        @click="userMenuOpen = !userMenuOpen"
      >
        <span
          class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-white"
        >
          <img
            v-if="auth.user?.picture"
            :src="auth.user.picture"
            :alt="userName"
            class="size-full object-cover"
          />
          <span v-else>{{ userInitials }}</span>
        </span>
        <span class="hidden max-w-32 truncate text-sm font-medium lg:block">{{ userName }}</span>
        <Icon icon="lucide:chevron-down" width="15" height="15" aria-hidden="true" />
      </button>
      <div
        v-if="userMenuOpen"
        class="absolute right-0 top-12 w-48 rounded-xl border border-input bg-background p-2 shadow-xl"
      >
        <p class="px-3 py-2 text-xs text-muted-foreground">{{ t('user.signedInAs') }}</p>
        <p class="truncate px-3 pb-1 text-sm font-medium">{{ userName }}</p>
        <p class="truncate px-3 pb-2 text-xs text-muted-foreground">{{ auth.user?.email }}</p>
        <RouterLink
          to="/settings"
          class="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
          @click="userMenuOpen = false"
        >
          <Icon icon="lucide:settings-2" width="16" height="16" aria-hidden="true" />
          {{ t('navigation.settings') }}
        </RouterLink>
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
          @click="auth.logout"
        >
          <Icon icon="lucide:log-out" width="16" height="16" aria-hidden="true" />
          {{ t('user.logout') }}
        </button>
      </div>
    </div>
    <button
      class="rounded-lg px-2.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      type="button"
      :aria-label="t('language.label')"
      @click="setLocale(locale === 'en' ? 'zh-CN' : 'en')"
    >
      {{ locale === 'en' ? '中' : 'EN' }}
    </button>
    <button
      class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      type="button"
      :aria-label="isDark ? t('theme.light') : t('theme.dark')"
      @click="toggleTheme"
    >
      <Icon :icon="isDark ? 'lucide:sun' : 'lucide:moon'" width="18" height="18" aria-hidden="true" />
    </button>
    <RouterLink
      to="/settings"
      class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      :aria-label="t('navigation.settings')"
    >
      <Icon icon="lucide:sliders-horizontal" width="18" height="18" aria-hidden="true" />
    </RouterLink>
  </div>
</template>
