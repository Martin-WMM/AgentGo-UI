<script setup lang="ts">
import { toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import ConfirmActionDialog from '../components/ConfirmActionDialog.vue';
import BatchDeleteBar from '../components/BatchDeleteBar.vue';
import ContentSkeleton from '../components/ContentSkeleton.vue';
import McpServerCard from '../components/McpServerCard.vue';
import type { ManagedMcpServer, McpServerStatus } from '../composables/useMcpServers';
import { mcpFailureI18n, mcpServerStatuses, useMcpServers } from '../composables/useMcpServers';
import { useBatchSelection } from '../composables/useBatchSelection';

type StatusFilter = McpServerStatus | 'ALL';

const filters: StatusFilter[] = ['ALL', ...mcpServerStatuses];

const { t } = useI18n();
const router = useRouter();
const { servers, refreshServers, removeServer, removeServers, probeServer } = useMcpServers();

const statusFilter = ref<StatusFilter>('ALL');
const serverToDelete = ref<ManagedMcpServer | null>(null);
const deletingServerId = ref<string | null>(null);
const probingServerId = ref<string | null>(null);
const loading = ref(false);
const loadFailed = ref(false);

const visibleServers = computed(() =>
  statusFilter.value === 'ALL'
    ? servers.value
    : servers.value.filter((server) => server.status === statusFilter.value),
);
const visibleIds = computed(() => visibleServers.value.map((server) => server.id));
const { selectedIds, toggle, toggleAll, clear, allSelected, count } = useBatchSelection(visibleIds);
const batchDeleteOpen = ref(false);
const batchDeleting = ref(false);

onMounted(() => {
  void reload();
});

async function reload() {
  loading.value = true;
  try {
    await refreshServers();
    loadFailed.value = false;
  } catch (caught) {
    loadFailed.value = true;
    toastError(t(mcpFailureI18n(caught, 'load')), t('toast.error'));
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  void router.push({ name: 'mcp-server-create' });
}

function openEdit(server: ManagedMcpServer) {
  void router.push({ name: 'mcp-server-edit', params: { id: server.id } });
}

async function confirmDelete() {
  if (!serverToDelete.value) return;
  deletingServerId.value = serverToDelete.value.id;
  try {
    await removeServer(serverToDelete.value.id);
    serverToDelete.value = null;
    toastSuccess(t('mcp.deleted'), t('toast.success'));
  } catch (caught) {
    toastError(t(mcpFailureI18n(caught)), t('toast.error'));
  } finally {
    deletingServerId.value = null;
  }
}

async function confirmBatchDelete() {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  batchDeleting.value = true;
  try {
    await removeServers(ids);
    clear();
    batchDeleteOpen.value = false;
    toastSuccess(t('selection.deleted', { count: ids.length }), t('toast.success'));
  } catch (caught) {
    toastError(t(mcpFailureI18n(caught)), t('toast.error'));
  } finally {
    batchDeleting.value = false;
  }
}

async function runProbe(server: ManagedMcpServer) {
  probingServerId.value = server.id;
  try {
    const probed = await probeServer(server.id);
    toastSuccess(
      t('mcp.probed', { name: probed.name, count: probed.tools.length }),
      t('toast.success'),
    );
  } catch (caught) {
    toastError(t(mcpFailureI18n(caught, 'probe')), t('toast.error'));
  } finally {
    probingServerId.value = null;
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
          <Icon icon="lucide:server" width="22" height="22" aria-hidden="true" />
        </div>
        <div>
          <h1 class="text-3xl font-semibold tracking-tight">{{ t('mcp.title') }}</h1>
          <p class="mt-2 text-muted-foreground">{{ t('mcp.description') }}</p>
        </div>
      </div>
      <button class="ag-btn ag-btn-primary" type="button" @click="openCreate">
        <Icon icon="lucide:plus" width="18" height="18" aria-hidden="true" />
        {{ t('mcp.createServer') }}
      </button>
    </div>

    <div class="mb-6 flex flex-wrap gap-2" role="tablist" :aria-label="t('mcp.statusFilterLabel')">
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
        {{ item === 'ALL' ? t('mcp.allStatuses') : t(`mcp.statuses.${item}`) }}
      </button>
    </div>

    <BatchDeleteBar
      v-if="!loading && !loadFailed"
      :count="count"
      :total="visibleServers.length"
      :all-selected="allSelected"
      :deleting="batchDeleting"
      @toggle-all="toggleAll"
      @remove="batchDeleteOpen = true"
    />

    <ContentSkeleton v-if="loading" kind="cards" :label="t('mcp.loading')" />
    <div
      v-else-if="loadFailed"
      class="rounded-2xl border border-dashed border-input px-6 py-16 text-center"
    >
      <h2 class="text-lg font-semibold">{{ t('mcp.loadError') }}</h2>
      <button class="ag-btn ag-btn-info mt-5" type="button" @click="reload">
        {{ t('mcp.retry') }}
      </button>
    </div>
    <div v-else-if="visibleServers.length" class="ag-card-grid">
      <McpServerCard
        v-for="(server, index) in visibleServers"
        :key="server.id"
        :server="server"
        :index="index"
        :deleting="deletingServerId === server.id"
        :probing="probingServerId === server.id"
        :selected="selectedIds.includes(server.id)"
        @edit="openEdit(server)"
        @remove="serverToDelete = server"
        @probe="runProbe(server)"
        @toggle="toggle(server.id)"
      />
    </div>
    <div v-else class="rounded-2xl border border-dashed border-input px-6 py-16 text-center">
      <h2 class="text-lg font-semibold">
        {{ statusFilter === 'ALL' ? t('mcp.emptyTitle') : t('mcp.emptyFilteredTitle') }}
      </h2>
      <p class="mt-2 text-sm text-muted-foreground">
        {{
          statusFilter === 'ALL'
            ? t('mcp.emptyDescription')
            : t('mcp.emptyFilteredDescription', { status: t(`mcp.statuses.${statusFilter}`) })
        }}
      </p>
      <button class="ag-btn ag-btn-primary mt-5" type="button" @click="openCreate">
        {{ t('mcp.createServer') }}
      </button>
    </div>

    <ConfirmActionDialog
      :open="Boolean(serverToDelete)"
      :title="t('mcp.delete')"
      :description="t('mcp.confirmDelete', { name: serverToDelete?.name ?? '' })"
      :confirm-label="t('mcp.delete')"
      @update:open="serverToDelete = $event ? serverToDelete : null"
      @confirm="confirmDelete"
    />
    <ConfirmActionDialog
      :open="batchDeleteOpen"
      :title="t('selection.deleteSelected')"
      :description="t('selection.confirmDelete', { count })"
      :confirm-label="t('selection.deleteSelected')"
      @update:open="batchDeleteOpen = $event"
      @confirm="confirmBatchDelete"
    />
  </section>
</template>
