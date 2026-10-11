<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useI18n } from 'vue-i18n';

import type { DensityPreference, SettingsLocale, ThemePreference } from '../api/settings';
import { useSettingsStore } from '../stores/settings';

const { t } = useI18n();
const settings = useSettingsStore();
const fieldClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring';

function onTheme(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (value === 'light' || value === 'dark' || value === 'system') {
    void settings.update({ theme: value satisfies ThemePreference });
  }
}

function onLocale(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (value === 'en' || value === 'zh-CN') {
    void settings.update({ locale: value satisfies SettingsLocale });
  }
}

function onDensity(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (value === 'comfortable' || value === 'compact') {
    void settings.update({ density: value satisfies DensityPreference });
  }
}

function onSidebar(event: Event) {
  void settings.update({ sidebarCollapsed: (event.target as HTMLInputElement).checked });
}

function onReduceMotion(event: Event) {
  void settings.update({ reduceMotion: (event.target as HTMLInputElement).checked });
}
</script>

<template>
  <form class="space-y-6 rounded-2xl border border-input bg-background p-6" @submit.prevent>
    <div class="flex items-start gap-3">
      <span class="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
        <Icon icon="lucide:monitor-cog" width="20" height="20" aria-hidden="true" />
      </span>
      <div>
        <h2 class="text-lg font-semibold">{{ t('system.title') }}</h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ t('system.description') }}</p>
      </div>
    </div>

    <div class="grid gap-5 sm:grid-cols-2">
      <div class="space-y-2">
        <label for="system-theme" class="text-sm font-medium">{{ t('system.theme') }}</label>
        <select
          id="system-theme"
          :class="fieldClass"
          :value="settings.settings.theme"
          @change="onTheme"
        >
          <option value="light">{{ t('system.themeLight') }}</option>
          <option value="dark">{{ t('system.themeDark') }}</option>
          <option value="system">{{ t('system.themeSystem') }}</option>
        </select>
      </div>
      <div class="space-y-2">
        <label for="system-language" class="text-sm font-medium">{{ t('system.language') }}</label>
        <select
          id="system-language"
          :class="fieldClass"
          :value="settings.settings.locale"
          @change="onLocale"
        >
          <option value="en">English</option>
          <option value="zh-CN">简体中文</option>
        </select>
      </div>
      <div class="space-y-2 sm:col-span-2">
        <label for="system-density" class="text-sm font-medium">{{ t('system.density') }}</label>
        <select
          id="system-density"
          :class="fieldClass"
          :value="settings.settings.density"
          @change="onDensity"
        >
          <option value="comfortable">{{ t('system.densityComfortable') }}</option>
          <option value="compact">{{ t('system.densityCompact') }}</option>
        </select>
      </div>
    </div>

    <div class="space-y-4">
      <label class="flex items-start gap-3 text-sm" for="system-sidebar">
        <input
          id="system-sidebar"
          class="mt-1 size-4 accent-current"
          type="checkbox"
          :checked="settings.settings.sidebarCollapsed"
          @change="onSidebar"
        />
        <span>
          <span class="font-medium">{{ t('system.sidebar') }}</span>
          <span class="mt-1 block text-muted-foreground">{{ t('system.sidebarHint') }}</span>
        </span>
      </label>
      <label class="flex items-start gap-3 text-sm" for="system-motion">
        <input
          id="system-motion"
          class="mt-1 size-4 accent-current"
          type="checkbox"
          :checked="settings.settings.reduceMotion"
          @change="onReduceMotion"
        />
        <span>
          <span class="font-medium">{{ t('system.reduceMotion') }}</span>
          <span class="mt-1 block text-muted-foreground">{{ t('system.reduceMotionHint') }}</span>
        </span>
      </label>
    </div>
  </form>
</template>
