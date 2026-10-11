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
    <p v-if="files.length" class="mb-4 text-sm text-muted-foreground">
      {{ t('files.fileCount', { count: files.length }) }}
    </p>
    <p v-if="error" role="alert" class="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-destructive">
      {{ error }}
    </p>
    <div v-if="loading" class="py-16 text-center text-sm text-muted-foreground">
      {{ t('files.loading') }}
    </div>
    <WorkspaceFileTable
      v-else-if="files.length"
      :files="files"
      :busy="busy"
      @download="downloadFile"
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
