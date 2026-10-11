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
      <button
        class="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        type="button"
        @click="openCreate"
      >
        {{ t('mcp.createServer') }}
      </button>
    </div>

    <McpServerFormDialog
      v-model:open="dialogOpen"
      v-model:name="form.name"
      v-model:endpoint-url="form.endpointUrl"
      v-model:auth-type="form.authType"
      v-model:auth-token="form.authToken"
      v-model:auth-header-name="form.authHeaderName"
      v-model:custom-headers="form.customHeaders"
      v-model:protocol-version="form.protocolVersion"
      v-model:enabled="form.enabled"
      v-model:description="form.description"
      :title="dialogTitle"
      :saving="saving"
      @save="saveServer"
    />
    <ConfirmActionDialog
      :open="Boolean(serverToDelete)"
      :title="t('mcp.delete')"
      :description="t('mcp.confirmDelete', { name: serverToDelete?.name ?? '' })"
      :confirm-label="t('mcp.delete')"
      @update:open="serverToDelete = $event ? serverToDelete : null"
      @confirm="confirmDelete"
    />
  </section>
</template>
