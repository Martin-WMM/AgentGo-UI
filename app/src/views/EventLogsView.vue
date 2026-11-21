<script setup lang="ts">
import { toastError } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ContentSkeleton from '../components/ContentSkeleton.vue';
import SystemEventTable from '../components/SystemEventTable.vue';
import { eventFailureI18n, useSystemEvents } from '../composables/useSystemEvents';

const { t } = useI18n();
const { events, page, pageSize, totalElements, totalPages, first, last, refreshEvents } =
  useSystemEvents();

const loading = ref(false);
const paging = ref(false);
const loadFailed = ref(false);

onMounted(() => {
  void loadPage(1);
});

async function loadPage(nextPage: number, nextSize = pageSize.value) {
  const initial = events.value.length === 0;
  if (initial) loading.value = true;
  else paging.value = true;
  try {
    await refreshEvents(nextPage, nextSize);
    loadFailed.value = false;
  } catch (caught) {
    if (events.value.length === 0) loadFailed.value = true;
    toastError(t(eventFailureI18n(caught)), t('toast.error'));
  } finally {
    loading.value = false;
    paging.value = false;
  }
}
</script>

<template>
  <section class="ag-page">
    <div class="ag-hero relative mb-8 flex items-start gap-4 overflow-hidden rounded-3xl p-6">
      <div
        class="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25"
      >
        <Icon icon="lucide:scroll-text" width="22" height="22" aria-hidden="true" />
      </div>
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">{{ t('events.title') }}</h1>
        <p class="mt-2 text-muted-foreground">{{ t('events.description') }}</p>
      </div>
    </div>

    <ContentSkeleton v-if="loading" kind="table" :label="t('events.loading')" />
    <div
      v-else-if="loadFailed"
      class="rounded-2xl border border-dashed border-input px-6 py-16 text-center"
    >
      <h2 class="text-lg font-semibold">{{ t('events.loadError') }}</h2>
      <button class="ag-btn ag-btn-info mt-5" type="button" @click="loadPage(page)">
        {{ t('events.retry') }}
      </button>
    </div>
    <SystemEventTable
      v-else-if="events.length"
      :events="events"
      :page="page"
      :page-size="pageSize"
      :total-elements="totalElements"
      :total-pages="totalPages"
      :first="first"
      :last="last"
      :paging="paging"
      @page="loadPage"
      @page-size="loadPage(1, $event)"
    />
    <div v-else class="rounded-2xl border border-dashed border-input px-6 py-16 text-center">
      <div
        class="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
      >
        <Icon icon="lucide:scroll-text" width="22" height="22" aria-hidden="true" />
      </div>
      <h2 class="text-lg font-semibold">{{ t('events.emptyTitle') }}</h2>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('events.emptyDescription') }}</p>
    </div>
  </section>
</template>
