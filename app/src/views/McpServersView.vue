<script setup lang="ts">
import { toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmActionDialog from '../components/ConfirmActionDialog.vue';
import McpServerCard from '../components/McpServerCard.vue';
import McpServerFormDialog from '../components/McpServerFormDialog.vue';
import type { ManagedMcpServer, McpAuthType, McpServerStatus } from '../composables/useMcpServers';
import { mcpFailureI18n, mcpServerStatuses, useMcpServers } from '../composables/useMcpServers';

type StatusFilter = McpServerStatus | 'ALL';

const filters: StatusFilter[] = ['ALL', ...mcpServerStatuses];

const { t } = useI18n();
const { servers, refreshServers, createServer, updateServer, removeServer, probeServer } =
  useMcpServers();

const statusFilter = ref<StatusFilter>('ALL');
const dialogOpen = ref(false);
const editing = ref<ManagedMcpServer | null>(null);
const serverToDelete = ref<ManagedMcpServer | null>(null);
const deletingServerId = ref<string | null>(null);
const probingServerId = ref<string | null>(null);
const saving = ref(false);
const loading = ref(false);
const loadFailed = ref(false);
const form = reactive({
  name: '',
  endpointUrl: '',
  authType: 'NONE' as McpAuthType,
  authToken: '',
  authHeaderName: '',
  customHeaders: '{}',
  protocolVersion: '2025-03-26',
  enabled: true,
  description: '',
});

const visibleServers = computed(() =>
  statusFilter.value === 'ALL'
    ? servers.value
    : servers.value.filter((server) => server.status === statusFilter.value),
);
const dialogTitle = computed(() => t(editing.value ? 'mcp.editServer' : 'mcp.createServer'));

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

function resetForm(server?: ManagedMcpServer | null) {
  editing.value = server ?? null;
  form.name = server?.name ?? '';
  form.endpointUrl = server?.endpointUrl ?? '';
  form.authType = server?.authType ?? 'NONE';
  form.authToken = server?.authToken ?? '';
  form.authHeaderName = server?.authHeaderName ?? '';
  form.customHeaders = JSON.stringify(server?.customHeaders ?? {}, null, 2);
  form.protocolVersion = server?.protocolVersion || '2025-03-26';
  form.enabled = server?.enabled ?? true;
  form.description = server?.description ?? '';
}

function openCreate() {
  resetForm(null);
  dialogOpen.value = true;
}

function openEdit(server: ManagedMcpServer) {
  resetForm(server);
  dialogOpen.value = true;
}

function parseCustomHeaders(): Record<string, string> | null {
  const raw = form.customHeaders.trim() || '{}';
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value !== 'string') return null;
      result[key] = value;
    }
    return result;
  } catch {
    return null;
  }
}

async function saveServer() {
  if (!form.name.trim() || !form.endpointUrl.trim() || saving.value) return;
  const customHeaders = parseCustomHeaders();
  if (!customHeaders) {
    toastError(t('mcp.customHeadersInvalid'), t('toast.error'));
    return;
  }
  saving.value = true;
  const input = {
    name: form.name,
    endpointUrl: form.endpointUrl,
    authType: form.authType,
    authToken: form.authToken,
    authHeaderName: form.authHeaderName,
    customHeaders,
    protocolVersion: form.protocolVersion,
    enabled: form.enabled,
    description: form.description,
  };
  try {
    if (editing.value) {
      await updateServer(editing.value.id, input);
      toastSuccess(t('mcp.updated', { name: form.name.trim() }), t('toast.success'));
    } else {
      await createServer(input);
      toastSuccess(t('mcp.created', { name: form.name.trim() }), t('toast.success'));
    }
    dialogOpen.value = false;
  } catch (caught) {
    toastError(t(mcpFailureI18n(caught)), t('toast.error'));
  } finally {
    saving.value = false;
  }
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
  <section class="mx-auto min-h-[calc(100vh-129px)] w-full max-w-6xl px-4 py-10 sm:px-6">
    <div
      class="relative mb-8 flex flex-col gap-4 overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-cyan-400/10 p-6 sm:flex-row sm:items-end sm:justify-between"
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
      <button
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20"
        type="button"
        @click="openCreate"
      >
        <Icon icon="lucide:plus" width="18" height="18" aria-hidden="true" />
        {{ t('mcp.createServer') }}
      </button>
    </div>

    <div class="mb-6 flex flex-wrap gap-2" role="tablist" :aria-label="t('mcp.statusFilterLabel')">
      <button
        v-for="item in filters"
        :key="item"
        type="button"
