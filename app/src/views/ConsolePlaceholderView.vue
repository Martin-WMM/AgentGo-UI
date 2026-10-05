<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import { consoleNavItems } from '../navigation';

const { t } = useI18n();
const route = useRoute();

const item = computed(
  () => consoleNavItems.find((entry) => entry.to === route.path) ?? consoleNavItems[0],
);
</script>

<template>
  <section
    class="mx-auto flex min-h-[calc(100vh-129px)] w-full max-w-3xl items-center px-4 py-16 sm:px-6"
  >
    <div class="w-full rounded-2xl border border-input bg-background p-8">
      <div class="mb-5 flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
        <Icon :icon="item.icon" width="22" height="22" aria-hidden="true" />
      </div>
      <h1 class="text-3xl font-semibold tracking-tight">
        {{ t(`console.items.${item.key}`) }}
      </h1>
      <p class="mt-3 text-muted-foreground">{{ t('console.placeholder') }}</p>
    </div>
  </section>
</template>
