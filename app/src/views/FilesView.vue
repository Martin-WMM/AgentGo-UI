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
        @click="openCreate"
      >
        {{ t('files.createWorkspace') }}
      </button>
    </div>

    <WorkspaceFormDialog
      v-model:open="dialogOpen"
      v-model:name="form.name"
      v-model:description="form.description"
      :title="dialogTitle"
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
    <Dialog :open="Boolean(notice)" @update:open="notice = ''">
      <h2 class="text-xl font-semibold">{{ t('files.title') }}</h2>
      <p class="mt-3 text-sm text-muted-foreground">{{ notice }}</p>
      <div class="mt-6 flex justify-end">
        <button
          type="button"
          class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          @click="notice = ''"
        >
          {{ t('files.save') }}
        </button>
      </div>
    </Dialog>
  </section>
</template>
