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
