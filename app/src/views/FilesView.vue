<script setup lang="ts">
import { toastError, toastSuccess, toastWarning } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import ConfirmActionDialog from '../components/ConfirmActionDialog.vue';
import BatchDeleteBar from '../components/BatchDeleteBar.vue';
import ContentSkeleton from '../components/ContentSkeleton.vue';
import WorkspaceCard from '../components/WorkspaceCard.vue';
import type { Workspace } from '../composables/useWorkspaces';
import { useWorkspaces } from '../composables/useWorkspaces';
import { useBatchSelection } from '../composables/useBatchSelection';

const { t } = useI18n();
const router = useRouter();
const { workspaces, workspacesReady, listFiles, removeWorkspace, removeWorkspaces } =
  useWorkspaces();
const deletingWorkspaceId = ref<string | null>(null);
const workspaceToDelete = ref<Workspace | null>(null);
const visibleIds = computed(() => workspaces.value.map((workspace) => workspace.id));
const { selectedIds, toggle, toggleAll, clear, allSelected, count } = useBatchSelection(visibleIds);
const batchDeleteOpen = ref(false);
const batchDeleting = ref(false);

async function deleteWorkspace(workspace: Workspace) {
  deletingWorkspaceId.value = workspace.id;
  try {
    const files = await listFiles(workspace.id);
    if (files.length) {
      toastWarning(t('files.workspaceNotEmpty'), t('toast.warning'));
      return;
    }
    workspaceToDelete.value = workspace;
  } catch {
    toastError(t('files.loadError'), t('toast.error'));
  } finally {
    deletingWorkspaceId.value = null;
  }
}

async function confirmDeleteWorkspace() {
  if (!workspaceToDelete.value) return;
  try {
    await removeWorkspace(workspaceToDelete.value.id);
    workspaceToDelete.value = null;
    toastSuccess(t('files.workspaceDeleted'), t('toast.success'));
  } catch {
    toastWarning(t('files.workspaceNotEmpty'), t('toast.warning'));
  }
}

async function prepareBatchDelete() {
  const chosen = workspaces.value.filter((workspace) => selectedIds.value.includes(workspace.id));
  if (!chosen.length) return;
  batchDeleting.value = true;
  try {
    for (const workspace of chosen) {
      const files = await listFiles(workspace.id);
      if (files.length) {
        toastWarning(t('files.workspaceNotEmpty'), t('toast.warning'));
        return;
      }
    }
    batchDeleteOpen.value = true;
  } catch {
    toastError(t('files.loadError'), t('toast.error'));
  } finally {
    batchDeleting.value = false;
  }
}

async function confirmBatchDelete() {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  batchDeleting.value = true;
  try {
    await removeWorkspaces(ids);
    clear();
    batchDeleteOpen.value = false;
    toastSuccess(t('selection.deleted', { count: ids.length }), t('toast.success'));
  } catch {
    toastWarning(t('files.workspaceNotEmpty'), t('toast.warning'));
  } finally {
    batchDeleting.value = false;
  }
}

function openCreate() {
  void router.push({ name: 'workspace-create' });
}

function openEdit(workspace: Workspace) {
  void router.push({ name: 'workspace-edit', params: { workspaceId: workspace.id } });
}

function openWorkspace(workspace: Workspace) {
  void router.push({ name: 'workspace-files', params: { workspaceId: workspace.id } });
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
          <Icon icon="lucide:folder-kanban" width="22" height="22" aria-hidden="true" />
        </div>
        <div>
          <h1 class="text-3xl font-semibold tracking-tight">{{ t('files.title') }}</h1>
          <p class="mt-2 text-muted-foreground">{{ t('files.description') }}</p>
        </div>
      </div>
      <button class="ag-btn ag-btn-primary" type="button" @click="openCreate">
        <Icon icon="lucide:plus" width="18" height="18" aria-hidden="true" />{{
          t('files.createWorkspace')
        }}
      </button>
    </div>

    <BatchDeleteBar
      v-if="workspacesReady"
      :count="count"
      :total="workspaces.length"
      :all-selected="allSelected"
      :deleting="batchDeleting"
      @toggle-all="toggleAll"
      @remove="prepareBatchDelete"
    />

    <ContentSkeleton v-if="!workspacesReady" kind="cards" :label="t('files.loading')" />
    <div v-else-if="workspaces.length" class="ag-card-grid">
      <WorkspaceCard
        v-for="(workspace, index) in workspaces"
        :key="workspace.id"
        :workspace="workspace"
        :index="index"
        :deleting="deletingWorkspaceId === workspace.id"
        :selected="selectedIds.includes(workspace.id)"
        @open="openWorkspace(workspace)"
        @edit="openEdit(workspace)"
        @remove="deleteWorkspace(workspace)"
        @toggle="toggle(workspace.id)"
      />
    </div>
    <div v-else class="rounded-2xl border border-dashed border-input px-6 py-16 text-center">
      <h2 class="mt-4 text-lg font-semibold">{{ t('files.emptyTitle') }}</h2>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('files.emptyDescription') }}</p>
      <button class="ag-btn ag-btn-primary mt-5" type="button" @click="openCreate">
        {{ t('files.createWorkspace') }}
      </button>
    </div>

    <ConfirmActionDialog
      :open="Boolean(workspaceToDelete)"
      :title="t('files.deleteWorkspace')"
      :description="t('files.confirmDeleteWorkspace')"
      :confirm-label="t('files.deleteWorkspace')"
      @update:open="workspaceToDelete = $event ? workspaceToDelete : null"
      @confirm="confirmDeleteWorkspace"
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
