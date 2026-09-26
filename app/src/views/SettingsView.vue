<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <section class="mx-auto min-h-[calc(100vh-129px)] w-full max-w-3xl px-4 py-12 sm:px-6">
    <div class="mb-8 flex items-start gap-4">
      <div class="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
        <Icon icon="lucide:sliders-horizontal" width="22" height="22" aria-hidden="true" />
      </div>
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">{{ t('settings.title') }}</h1>
        <p class="mt-2 text-muted-foreground">{{ t('settings.description') }}</p>
      </div>
    </div>
    <div class="rounded-2xl border border-input bg-background p-5 text-sm text-muted-foreground">
      {{ t('brandTagline') }}
    </div>
  </section>
</template>
