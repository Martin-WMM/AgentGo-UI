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
