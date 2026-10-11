<script setup lang="ts">
import { toastError, toastSuccess, toastWarning } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import ConfirmActionDialog from '../components/ConfirmActionDialog.vue';
import WorkspaceCard from '../components/WorkspaceCard.vue';
import WorkspaceFormDialog from '../components/WorkspaceFormDialog.vue';
import type { Workspace } from '../composables/useWorkspaces';
import { useWorkspaces, workspaceFailureI18n } from '../composables/useWorkspaces';
import { DEFAULT_WORKSPACE_COLOR } from '../lib/workspaceColors';

const { t } = useI18n();
const router = useRouter();
const { workspaces, createWorkspace, updateWorkspace, listFiles, removeWorkspace } =
  useWorkspaces();
const dialogOpen = ref(false);
const editing = ref<Workspace | null>(null);
const deletingWorkspaceId = ref<string | null>(null);
const workspaceToDelete = ref<Workspace | null>(null);
const saving = ref(false);
const form = reactive({ name: '', description: '', color: DEFAULT_WORKSPACE_COLOR });
const dialogTitle = computed(() =>
  t(editing.value ? 'files.editWorkspace' : 'files.createWorkspace'),
);

function openCreate() {
  editing.value = null;
  form.name = '';
  form.description = '';
  form.color = DEFAULT_WORKSPACE_COLOR;
  dialogOpen.value = true;
}

function openEdit(workspace: Workspace) {
  editing.value = workspace;
  form.name = workspace.name;
  form.description = workspace.description;
  form.color = workspace.color;
  dialogOpen.value = true;
}

async function saveWorkspace() {
  if (!form.name.trim() || saving.value) return;
  const name = form.name.trim();
  saving.value = true;
  try {
    if (editing.value) {
      await updateWorkspace(editing.value.id, form.name, form.description, form.color);
      toastSuccess(t('files.workspaceUpdated', { name }), t('toast.success'));
    } else {
      await createWorkspace(form.name, form.description, form.color);
      toastSuccess(t('files.workspaceCreated', { name }), t('toast.success'));
    }
    dialogOpen.value = false;
  } catch (caught) {
    toastError(t(workspaceFailureI18n(caught)), t('toast.error'));
  } finally {
    saving.value = false;
  }
}

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

function openWorkspace(workspace: Workspace) {
  router.push({ name: 'workspace-files', params: { workspaceId: workspace.id } });
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
          <Icon icon="lucide:folder-kanban" width="22" height="22" aria-hidden="true" />
        </div>
        <div>
          <h1 class="text-3xl font-semibold tracking-tight">{{ t('files.title') }}</h1>
          <p class="mt-2 text-muted-foreground">{{ t('files.description') }}</p>
        </div>
      </div>
      <button
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20"
        type="button"
        @click="openCreate"
      >
        <Icon icon="lucide:plus" width="18" height="18" aria-hidden="true" />{{
          t('files.createWorkspace')
        }}
      </button>
    </div>

    <div v-if="workspaces.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <WorkspaceCard
        v-for="(workspace, index) in workspaces"
        :key="workspace.id"
        :workspace="workspace"
        :index="index"
        :deleting="deletingWorkspaceId === workspace.id"
        @open="openWorkspace(workspace)"
        @edit="openEdit(workspace)"
        @remove="deleteWorkspace(workspace)"
      />
    </div>
    <div v-else class="rounded-2xl border border-dashed border-input px-6 py-16 text-center">
      <h2 class="mt-4 text-lg font-semibold">{{ t('files.emptyTitle') }}</h2>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('files.emptyDescription') }}</p>
      <button
        class="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        type="button"
        @click="openCreate"
      >
        {{ t('files.createWorkspace') }}
      </button>
    </div>

    <WorkspaceFormDialog
      v-model:open="dialogOpen"
      v-model:name="form.name"
      v-model:description="form.description"
      v-model:color="form.color"
      :title="dialogTitle"
      :saving="saving"
      @save="saveWorkspace"
    />
    <ConfirmActionDialog
      :open="Boolean(workspaceToDelete)"
      :title="t('files.deleteWorkspace')"
      :description="t('files.confirmDeleteWorkspace')"
      :confirm-label="t('files.deleteWorkspace')"
      @update:open="workspaceToDelete = $event ? workspaceToDelete : null"
      @confirm="confirmDeleteWorkspace"
    />
  </section>
</template>
