<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { Button } from '@agentgo/ui';
import { useTheme } from './composables/useTheme';

const { locale, t } = useI18n();
const { theme, toggleTheme } = useTheme();
const isDark = computed(() => theme.value === 'dark');

function setLocale(nextLocale: 'en' | 'zh-CN') {
  locale.value = nextLocale;
  localStorage.setItem('agentgo-locale', nextLocale);
}
</script>

<template>
  <main class="min-h-screen bg-background text-foreground">
    <section class="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <header class="mb-12 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 text-primary">
          <Icon icon="lucide:bot" width="32" height="32" aria-hidden="true" />
          <span class="text-sm font-semibold uppercase tracking-[0.3em]">{{ t('brand') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <div
            class="flex rounded-md border border-input p-1"
            role="group"
            :aria-label="t('language.label')"
          >
            <button
              class="rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-accent"
              :class="
                locale === 'en' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              "
              type="button"
              :aria-pressed="locale === 'en'"
              @click="setLocale('en')"
            >
              {{ t('language.english') }}
            </button>
            <button
              class="rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-accent"
              :class="
                locale === 'zh-CN' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              "
              type="button"
              :aria-pressed="locale === 'zh-CN'"
              @click="setLocale('zh-CN')"
            >
              {{ t('language.chinese') }}
            </button>
          </div>
          <button
            class="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            type="button"
            :aria-label="isDark ? t('theme.light') : t('theme.dark')"
            @click="toggleTheme"
          >
            <Icon
              :icon="isDark ? 'lucide:sun' : 'lucide:moon'"
              width="20"
              height="20"
              aria-hidden="true"
            />
          </button>
        </div>
      </header>
      <div class="mb-8 flex items-center gap-3 text-primary">
        <Icon icon="lucide:bot" width="32" height="32" aria-hidden="true" />
        <span class="text-sm font-semibold uppercase tracking-[0.3em]">{{ t('brand') }}</span>
      </div>
      <h1 class="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
        {{ t('hero.title') }}
      </h1>
      <p class="mt-6 max-w-2xl text-lg text-muted-foreground">
        {{ t('hero.description') }}
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <Button>{{ t('hero.primaryAction') }}</Button>
        <Button variant="outline">
          <Icon icon="lucide:book-open" width="18" height="18" aria-hidden="true" />
          {{ t('hero.secondaryAction') }}
        </Button>
      </div>
    </section>
  </main>
</template>
