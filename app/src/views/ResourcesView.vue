<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { apiData } from '../api/fileRequest';
import ResourceCapabilityCard from '../components/ResourceCapabilityCard.vue';
import { resourceCatalog, type ResourceKey } from '../navigation';

type CountState = number | 'loading' | 'unavailable';

interface PromptCountPage {
  totalElements?: number;
  data?: unknown[];
}

const { t } = useI18n();
const query = ref('');

const counts = reactive<Record<ResourceKey, CountState>>({
  files: 'loading',
  models: 'loading',
  connections: 0,
  mcp: 'loading',
  skills: 0,
  a2a: 'loading',
  prompts: 'loading',
  apis: 0,
});

const visibleItems = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase();
  if (!needle) return resourceCatalog;
  return resourceCatalog.filter((item) => {
    const name = t(`console.items.${item.key}`).toLocaleLowerCase();
    const description = t(`resources.descriptions.${item.key}`).toLocaleLowerCase();
    return name.includes(needle) || description.includes(needle);
  });
});

onMounted(() => {
  void loadCounts();
});

async function loadCounts() {
  const [workspaces, models, servers, a2aAgents, prompts] = await Promise.allSettled([
    apiData<unknown[]>('/api/v1/workspaces'),
    apiData<unknown[]>('/api/v1/models'),
    apiData<unknown[]>('/api/v1/mcpServers'),
    apiData<unknown[]>('/api/v1/a2aAgents'),
    apiData<PromptCountPage | unknown[]>('/api/v1/promptTemplates?page=1&size=1'),
  ]);
  counts.files = settledLength(workspaces);
  counts.models = settledLength(models);
  counts.mcp = settledLength(servers);
  counts.a2a = settledLength(a2aAgents);
  counts.prompts = settledPromptTotal(prompts);
}

function settledLength(result: PromiseSettledResult<unknown[]>): CountState {
  if (result.status !== 'fulfilled' || !Array.isArray(result.value)) return 'unavailable';
  return result.value.length;
}

function settledPromptTotal(result: PromiseSettledResult<PromptCountPage | unknown[]>): CountState {
  if (result.status !== 'fulfilled') return 'unavailable';
  const value = result.value;
  if (Array.isArray(value)) return value.length;
  if (typeof value.totalElements === 'number') return value.totalElements;
  if (Array.isArray(value.data)) return value.data.length;
  return 'unavailable';
}
</script>

<template>
  <section class="ag-page">
    <div
      class="ag-hero relative mb-8 flex flex-col gap-5 overflow-hidden rounded-3xl p-6 lg:flex-row lg:items-end lg:justify-between"
    >
      <div class="flex min-w-0 items-start gap-4">
        <div
          class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25"
        >
          <Icon icon="lucide:blocks" width="22" height="22" aria-hidden="true" />
        </div>
        <div class="min-w-0">
          <h1 class="text-3xl font-semibold tracking-tight">{{ t('resources.title') }}</h1>
          <p class="mt-2 text-muted-foreground">{{ t('resources.description') }}</p>
        </div>
      </div>
      <label class="relative block w-full shrink-0 lg:w-72">
        <span class="sr-only">{{ t('resources.searchLabel') }}</span>
        <Icon
          icon="lucide:search"
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          width="16"
          height="16"
          aria-hidden="true"
        />
        <input
          v-model="query"
          type="search"
          autocomplete="off"
          class="h-11 w-full rounded-xl border border-input bg-background py-2 pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring [&::-webkit-search-cancel-button]:hidden"
          :placeholder="t('resources.searchPlaceholder')"
          :aria-label="t('resources.searchLabel')"
        />
        <button
          v-if="query"
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          :aria-label="t('resources.clearSearch')"
          @click="query = ''"
        >
          <Icon icon="lucide:x" width="14" height="14" aria-hidden="true" />
        </button>
      </label>
    </div>

    <div v-if="visibleItems.length" class="ag-card-grid">
      <ResourceCapabilityCard
        v-for="item in visibleItems"
        :key="item.key"
        :item="item"
        :count="counts[item.key]"
      />
    </div>
    <div v-else class="rounded-2xl border border-dashed border-input px-6 py-16 text-center">
      <h2 class="text-lg font-semibold">{{ t('resources.emptyTitle') }}</h2>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('resources.emptyDescription') }}</p>
    </div>
  </section>
</template>
