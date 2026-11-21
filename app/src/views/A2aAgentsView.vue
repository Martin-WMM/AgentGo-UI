<script setup lang="ts">
import { toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import A2aAgentCard from '../components/A2aAgentCard.vue';
import BatchDeleteBar from '../components/BatchDeleteBar.vue';
import ConfirmActionDialog from '../components/ConfirmActionDialog.vue';
import ContentSkeleton from '../components/ContentSkeleton.vue';
import type { A2aAgentStatus, ManagedA2aAgent } from '../composables/useA2aAgents';
import { a2aAgentStatuses, a2aFailureI18n, useA2aAgents } from '../composables/useA2aAgents';
import { useBatchSelection } from '../composables/useBatchSelection';

type StatusFilter = A2aAgentStatus | 'ALL';

const filters: StatusFilter[] = ['ALL', ...a2aAgentStatuses];

const { t } = useI18n();
const router = useRouter();
const { agents, refreshAgents, removeAgent, removeAgents } = useA2aAgents();

const statusFilter = ref<StatusFilter>('ALL');
const agentToDelete = ref<ManagedA2aAgent | null>(null);
const deletingAgentId = ref<string | null>(null);
const loading = ref(false);
const loadFailed = ref(false);

const visibleAgents = computed(() =>
  statusFilter.value === 'ALL'
    ? agents.value
    : agents.value.filter((agent) => agent.status === statusFilter.value),
);
const visibleIds = computed(() => visibleAgents.value.map((agent) => agent.id));
const { selectedIds, toggle, toggleAll, clear, allSelected, count } = useBatchSelection(visibleIds);
const batchDeleteOpen = ref(false);
const batchDeleting = ref(false);

onMounted(() => {
  void reload();
});

async function reload() {
  loading.value = true;
  try {
    await refreshAgents();
    loadFailed.value = false;
  } catch (caught) {
    loadFailed.value = true;
    toastError(t(a2aFailureI18n(caught, 'load')), t('toast.error'));
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  void router.push({ name: 'a2a-agent-create' });
}

function openEdit(agent: ManagedA2aAgent) {
  void router.push({ name: 'a2a-agent-edit', params: { id: agent.id } });
}

async function confirmDelete() {
  if (!agentToDelete.value) return;
  deletingAgentId.value = agentToDelete.value.id;
  try {
    await removeAgent(agentToDelete.value.id);
    agentToDelete.value = null;
    toastSuccess(t('a2a.deleted'), t('toast.success'));
  } catch (caught) {
    toastError(t(a2aFailureI18n(caught)), t('toast.error'));
  } finally {
    deletingAgentId.value = null;
  }
}

async function confirmBatchDelete() {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  batchDeleting.value = true;
  try {
    await removeAgents(ids);
    clear();
    batchDeleteOpen.value = false;
    toastSuccess(t('selection.deleted', { count: ids.length }), t('toast.success'));
  } catch (caught) {
    toastError(t(a2aFailureI18n(caught)), t('toast.error'));
  } finally {
    batchDeleting.value = false;
  }
}
</script>

<template>
  <section class="ag-page">
    <div
      class="ag-hero relative mb-8 flex flex-col gap-4 overflow-hidden rounded-3xl p-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <div class="flex items-start gap-4">
        <div
          class="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25"
        >
          <Icon icon="lucide:bot" width="22" height="22" aria-hidden="true" />
        </div>
        <div>
          <h1 class="text-3xl font-semibold tracking-tight">{{ t('a2a.title') }}</h1>
          <p class="mt-2 text-muted-foreground">{{ t('a2a.description') }}</p>
        </div>
      </div>
      <button class="ag-btn ag-btn-primary" type="button" @click="openCreate">
        <Icon icon="lucide:plus" width="18" height="18" aria-hidden="true" />
        {{ t('a2a.createAgent') }}
      </button>
    </div>

    <div class="mb-6 flex flex-wrap gap-2" role="tablist" :aria-label="t('a2a.statusFilterLabel')">
      <button
        v-for="item in filters"
        :key="item"
        type="button"
        role="tab"
        class="ag-chip rounded-full border px-3 py-1.5 text-sm font-medium"
        :class="
          item === statusFilter
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
        "
        :aria-selected="item === statusFilter"
        @click="statusFilter = item"
      >
        {{ item === 'ALL' ? t('a2a.allStatuses') : t(`a2a.statuses.${item}`) }}
      </button>
    </div>

    <BatchDeleteBar
      v-if="!loading && !loadFailed"
      :count="count"
      :total="visibleAgents.length"
      :all-selected="allSelected"
      :deleting="batchDeleting"
      @toggle-all="toggleAll"
      @remove="batchDeleteOpen = true"
    />

    <ContentSkeleton v-if="loading" kind="cards" :label="t('a2a.loading')" />
    <div
      v-else-if="loadFailed"
      class="rounded-2xl border border-dashed border-input px-6 py-16 text-center"
