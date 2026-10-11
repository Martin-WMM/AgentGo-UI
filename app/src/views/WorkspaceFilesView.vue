<script setup lang="ts">
import { toastError, toastSuccess, toastWarning } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import ConfirmActionDialog from '../components/ConfirmActionDialog.vue';
import WorkspaceFileTable from '../components/WorkspaceFileTable.vue';
import type { WorkspaceFile } from '../composables/useWorkspaces';
import { uploadFailureI18n, useWorkspaces } from '../composables/useWorkspaces';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { getWorkspace, listFiles, uploadFile, deleteFile, downloadFile, removeWorkspace } =
  useWorkspaces();
const workspaceId = String(route.params.workspaceId);
const workspace = computed(() => getWorkspace(workspaceId));
const files = ref<WorkspaceFile[]>([]);
const loading = ref(true);
const busy = ref(false);
const input = ref<HTMLInputElement | null>(null);
const fileToDelete = ref<WorkspaceFile | null>(null);
const deleteWorkspaceOpen = ref(false);

async function refresh() {
  loading.value = true;
  try {
    files.value = await listFiles(workspaceId);
  } catch {
    toastError(t('files.loadError'), t('toast.error'));
  } finally {
    loading.value = false;
  }
}

async function onUpload(event: Event) {
  const selected = (event.target as HTMLInputElement).files?.[0];
  if (!selected) return;
  busy.value = true;
  try {
    await uploadFile(workspaceId, selected);
    await refresh();
    toastSuccess(t('files.uploadSuccess', { name: selected.name }), t('toast.success'));
  } catch (caught) {
    const mapped = uploadFailureI18n(caught);
    toastError(t(mapped.key, { limit: mapped.limit }), t('toast.error'));
  } finally {
    busy.value = false;
    if (input.value) input.value.value = '';
  }
}

async function confirmDeleteFile() {
  if (!fileToDelete.value) return;
  const name = fileToDelete.value.name;
  busy.value = true;
  try {
    await deleteFile(fileToDelete.value.path);
    await refresh();
    toastSuccess(t('files.deleteFileSuccess', { name }), t('toast.success'));
  } catch {
    toastError(t('files.deleteError'), t('toast.error'));
  } finally {
    busy.value = false;
    fileToDelete.value = null;
  }
}

async function onDownload(path: string) {
  try {
    await downloadFile(path);
  } catch {
    toastError(t('files.downloadError'), t('toast.error'));
  }
}

async function confirmDeleteWorkspace() {
  try {
    await removeWorkspace(workspaceId);
    deleteWorkspaceOpen.value = false;
    toastSuccess(t('files.workspaceDeleted'), t('toast.success'));
    router.push({ name: 'console-files' });
  } catch {
    toastWarning(t('files.workspaceNotEmpty'), t('toast.warning'));
    deleteWorkspaceOpen.value = false;
  }
}

onMounted(refresh);
</script>

<template>
  <section
    v-if="workspace"
    class="mx-auto min-h-[calc(100vh-129px)] w-full max-w-6xl px-4 py-10 sm:px-6"
  >
    <button
      type="button"
      class="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      @click="router.push({ name: 'console-files' })"
    >
      <Icon icon="lucide:arrow-left" width="16" height="16" aria-hidden="true" />{{
        t('files.back')
      }}
    </button>
    <div
      class="mb-8 flex flex-col gap-4 overflow-hidden rounded-3xl border p-6 sm:flex-row sm:items-start sm:justify-between"
      :style="{
        borderColor: `color-mix(in srgb, ${workspace.color} 45%, transparent)`,
        backgroundImage: `linear-gradient(to bottom right, color-mix(in srgb, ${workspace.color} 18%, transparent), transparent)`,
      }"
    >
      <div class="flex items-start gap-4">
        <div
          class="flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
          :style="{ backgroundColor: workspace.color }"
        >
          <Icon icon="lucide:folder" width="22" height="22" aria-hidden="true" />
        </div>
        <div>
          <h1 class="text-3xl font-semibold tracking-tight">{{ workspace.name }}</h1>
          <p v-if="workspace.description" class="mt-2 text-muted-foreground">
            {{ workspace.description }}
          </p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <label
          class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Icon icon="lucide:upload" width="17" height="17" aria-hidden="true" />{{
            busy ? t('files.uploading') : t('files.upload')
          }}
          <input ref="input" type="file" class="sr-only" :disabled="busy" @change="onUpload" />
        </label>
        <button
          type="button"
          class="rounded-lg border border-input px-3 py-2.5 text-sm text-destructive hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="files.length > 0 || loading"
          @click="deleteWorkspaceOpen = true"
        >
          {{ t('files.deleteWorkspace') }}
        </button>
      </div>
    </div>
    <p v-if="files.length" class="mb-4 text-sm text-muted-foreground">
      {{ t('files.fileCount', { count: files.length }) }}
    </p>
    <div v-if="loading" class="py-16 text-center text-sm text-muted-foreground">
      {{ t('files.loading') }}
    </div>
    <WorkspaceFileTable
      v-else-if="files.length"
      :files="files"
      :busy="busy"
      @download="onDownload"
      @remove="fileToDelete = $event"
    />
    <div v-else class="rounded-2xl border border-dashed border-input px-6 py-16 text-center">
      <h2 class="text-lg font-semibold">{{ t('files.emptyFilesTitle') }}</h2>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('files.emptyFilesDescription') }}</p>
    </div>
  </section>
  <section v-else class="mx-auto flex min-h-[calc(100vh-129px)] w-full max-w-3xl items-center px-4">
    <div class="rounded-2xl border border-input p-8">
      <h1 class="text-xl font-semibold">{{ t('files.notFound') }}</h1>
      <button
        type="button"
        class="mt-4 text-sm text-primary underline"
        @click="router.push({ name: 'console-files' })"
      >
        {{ t('files.back') }}
      </button>
    </div>
  </section>
  <ConfirmActionDialog
    :open="Boolean(fileToDelete)"
    :title="t('files.delete')"
    :description="fileToDelete ? t('files.confirmDeleteFile', { name: fileToDelete.name }) : ''"
    :confirm-label="t('files.delete')"
    @update:open="fileToDelete = $event ? fileToDelete : null"
    @confirm="confirmDeleteFile"
  />
  <ConfirmActionDialog
    v-model:open="deleteWorkspaceOpen"
    :title="t('files.deleteWorkspace')"
    :description="t('files.confirmDeleteWorkspace')"
    :confirm-label="t('files.deleteWorkspace')"
    @confirm="confirmDeleteWorkspace"
  />
</template>
