<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';

import type { ResourceCatalogItem } from '../navigation';

const props = defineProps<{
  item: ResourceCatalogItem;
  count: number | 'loading' | 'unavailable';
}>();

const { t } = useI18n();

const countLabel = computed(() => {
  if (props.count === 'loading') return t('resources.countLoading');
  if (props.count === 'unavailable') return t('resources.countUnavailable');
  return t(`resources.counts.${props.item.key}`, { count: props.count });
});
</script>

<template>
  <RouterLink
    :to="item.to"
    class="ag-card ag-rise group relative flex min-h-52 flex-col overflow-hidden rounded-2xl border p-5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
    :style="{
      borderColor: `color-mix(in srgb, ${item.color} 55%, transparent)`,
      backgroundImage: `linear-gradient(160deg, color-mix(in srgb, ${item.color} 14%, transparent), transparent 46%)`,
    }"
  >
    <div class="absolute inset-x-0 top-0 h-1.5" :style="{ backgroundColor: item.color }" />
    <div
      class="absolute -right-12 -top-12 size-36 rounded-full blur-2xl"
      :style="{ backgroundColor: `color-mix(in srgb, ${item.color} 32%, transparent)` }"
    />
    <div class="relative flex items-start gap-3">
      <div
        class="flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
        :style="{ backgroundColor: item.color }"
      >
        <Icon :icon="item.icon" width="22" height="22" aria-hidden="true" />
      </div>
      <div class="min-w-0 pt-0.5">
        <h2 class="truncate text-lg font-semibold">{{ t(`console.items.${item.key}`) }}</h2>
      </div>
    </div>
    <p class="relative mt-4 line-clamp-3 min-h-10 flex-1 text-sm text-muted-foreground">
      {{ t(`resources.descriptions.${item.key}`) }}
    </p>
    <p
      class="relative mt-5 flex items-center justify-between gap-3 text-sm font-medium text-muted-foreground"
    >
      <span class="inline-flex min-w-0 items-center gap-1.5">
        <Icon icon="lucide:hash" width="15" height="15" class="shrink-0" aria-hidden="true" />
        <span v-if="count === 'loading'" class="ag-skeleton inline-block h-4 w-16 rounded-full" />
        <span v-else class="truncate">{{ countLabel }}</span>
      </span>
      <Icon
        icon="lucide:arrow-up-right"
        class="shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        width="16"
        height="16"
        aria-hidden="true"
      />
    </p>
  </RouterLink>
</template>
