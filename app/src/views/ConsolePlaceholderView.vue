<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import { resourceCatalog } from '../navigation';

const { t } = useI18n();
const route = useRoute();

const item = computed(
  () => resourceCatalog.find((entry) => entry.to === route.path) ?? resourceCatalog[0],
);
</script>

<template>
  <section class="ag-page ag-page--center">
    <div class="w-full min-w-0 rounded-2xl border border-input bg-background p-8">
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
