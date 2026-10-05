<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, RouterView, useRoute } from 'vue-router';

import AppHeaderActions from './components/AppHeaderActions.vue';
import { useTheme } from './composables/useTheme';

const { t } = useI18n();
const { theme } = useTheme();
const route = useRoute();
const isDark = computed(() => theme.value === 'dark');
const logoSource = computed(() =>
  isDark.value ? '/assets/logo-dark.png' : '/assets/logo-light.png',
);
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

        <AppHeaderActions />
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
