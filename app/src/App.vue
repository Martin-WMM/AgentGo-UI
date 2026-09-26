<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, RouterView, useRoute } from 'vue-router';

import { useTheme } from './composables/useTheme';

const { locale, t } = useI18n();
const { theme, toggleTheme } = useTheme();
const route = useRoute();
const userMenuOpen = ref(false);
const isDark = computed(() => theme.value === 'dark');
const logoSource = computed(() =>
  isDark.value ? '/assets/logo-dark.png' : '/assets/logo-light.png',
);

function setLocale(nextLocale: 'en' | 'zh-CN') {
  locale.value = nextLocale;
  localStorage.setItem('agentgo-locale', nextLocale);
}

function toggleLocale() {
  setLocale(locale.value === 'en' ? 'zh-CN' : 'en');
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground">
    <header class="sticky top-0 z-30 border-b border-input/70 bg-background/90 backdrop-blur">
      <div class="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
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

        <nav class="hidden items-center gap-1 md:flex" :aria-label="t('navigation.label')">
          <RouterLink
            to="/"
            class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            :class="
              route.path === '/' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
            "
          >
            {{ t('navigation.home') }}
          </RouterLink>
          <RouterLink
            to="/chat"
            class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            :class="
              route.path === '/chat' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
            "
          >
            {{ t('navigation.chat') }}
          </RouterLink>
        </nav>

        <div class="ml-auto flex items-center gap-1">
          <div class="relative">
            <button
              class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent"
              type="button"
              :aria-expanded="userMenuOpen"
              :aria-label="t('user.menu')"
              @click="userMenuOpen = !userMenuOpen"
            >
              <span
                class="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-white"
                >MW</span
              >
              <span class="hidden text-sm font-medium lg:block">Martin</span>
              <Icon icon="lucide:chevron-down" width="15" height="15" aria-hidden="true" />
            </button>
            <div
              v-if="userMenuOpen"
              class="absolute right-0 top-12 w-48 rounded-xl border border-input bg-background p-2 shadow-xl"
            >
              <p class="px-3 py-2 text-xs text-muted-foreground">{{ t('user.signedInAs') }}</p>
              <p class="px-3 pb-2 text-sm font-medium">Martin</p>
              <RouterLink
                to="/settings"
                class="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                @click="userMenuOpen = false"
              >
                <Icon icon="lucide:settings-2" width="16" height="16" aria-hidden="true" />
                {{ t('navigation.settings') }}
              </RouterLink>
            </div>
          </div>
          <button
            class="rounded-lg px-2.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            type="button"
            :aria-label="t('language.label')"
            @click="toggleLocale"
          >
            {{ locale === 'en' ? '中' : 'EN' }}
          </button>
          <button
            class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            type="button"
            :aria-label="isDark ? t('theme.light') : t('theme.dark')"
            @click="toggleTheme"
          >
            <Icon
              :icon="isDark ? 'lucide:sun' : 'lucide:moon'"
              width="18"
              height="18"
              aria-hidden="true"
            />
          </button>
          <RouterLink
            to="/settings"
            class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            :aria-label="t('navigation.settings')"
          >
            <Icon icon="lucide:sliders-horizontal" width="18" height="18" aria-hidden="true" />
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="flex-1"><RouterView /></main>

    <footer class="border-t border-input/70 bg-background">
      <div
        class="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"
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
</template>
