<script setup lang="ts">
import { parseJson, toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import ContentSkeleton from '../components/ContentSkeleton.vue';
import JsonEditor from '../components/JsonEditor.vue';
import {
  mcpAuthTypes,
  mcpFailureI18n,
  useMcpServers,
  type McpAuthType,
} from '../composables/useMcpServers';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { getServer, createServer, updateServer } = useMcpServers();

const saving = ref(false);
const loading = ref(false);
const loadFailed = ref(false);
const form = reactive({
  groupName: 'default',
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

const serverId = computed(() => {
  const raw = route.params.id;
  return typeof raw === 'string' ? raw : null;
});
const isCreate = computed(() => !serverId.value);
const pageTitle = computed(() => t(isCreate.value ? 'mcp.createServer' : 'mcp.editServer'));
const canSave = computed(
  () =>
    Boolean(form.groupName.trim() && form.name.trim() && form.endpointUrl.trim()) && !saving.value,
);
const showAuthToken = computed(() => form.authType === 'BEARER' || form.authType === 'HEADER');
const showAuthHeaderName = computed(() => form.authType === 'HEADER');

onMounted(async () => {
  if (!serverId.value) return;
  loading.value = true;
  try {
    const server = await getServer(serverId.value);
    form.groupName = server.groupName;
    form.name = server.name;
    form.endpointUrl = server.endpointUrl;
    form.authType = server.authType;
    form.authToken = server.authToken;
    form.authHeaderName = server.authHeaderName;
    form.customHeaders = JSON.stringify(server.customHeaders ?? {}, null, 2);
    form.protocolVersion = server.protocolVersion || '2025-03-26';
    form.enabled = server.enabled;
    form.description = server.description;
    loadFailed.value = false;
  } catch (caught) {
    loadFailed.value = true;
    toastError(t(mcpFailureI18n(caught, 'load')), t('toast.error'));
  } finally {
    loading.value = false;
  }
});

function goBack() {
  void router.push({ name: 'console-mcp' });
}

function parseCustomHeaders(): Record<string, string> | null {
  const parsed = parseJson(form.customHeaders, 'string-map');
  if (!parsed.ok) return null;
  return parsed.value as Record<string, string>;
}

async function saveServer() {
  if (!canSave.value) return;
  const customHeaders = parseCustomHeaders();
  if (!customHeaders) {
    toastError(t('mcp.customHeadersInvalid'), t('toast.error'));
    return;
  }
  saving.value = true;
  const input = {
    groupName: form.groupName,
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
    if (serverId.value) {
      await updateServer(serverId.value, input);
      toastSuccess(t('mcp.updated', { name: form.name.trim() }), t('toast.success'));
    } else {
      await createServer(input);
      toastSuccess(t('mcp.created', { name: form.name.trim() }), t('toast.success'));
    }
    goBack();
  } catch (caught) {
    toastError(t(mcpFailureI18n(caught)), t('toast.error'));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="ag-page ag-page--tight">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-start gap-3">
        <button
          type="button"
          class="mt-0.5 rounded-xl border border-input p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          :aria-label="t('mcp.backToList')"
          @click="goBack"
        >
          <Icon icon="lucide:arrow-left" width="18" height="18" aria-hidden="true" />
        </button>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">{{ pageTitle }}</h1>
          <p class="mt-1.5 text-sm text-muted-foreground">{{ t('mcp.formHint') }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 self-end sm:self-auto">
        <button type="button" class="ag-btn ag-btn-ghost" @click="goBack">
          {{ t('mcp.cancel') }}
        </button>
        <button
          type="button"
          class="ag-btn ag-btn-success"
          :disabled="!canSave || loading || loadFailed"
          @click="saveServer"
        >
          <Icon icon="lucide:save" width="16" height="16" aria-hidden="true" />
          {{ saving ? t('mcp.saving') : t('mcp.save') }}
        </button>
      </div>
    </div>

    <ContentSkeleton v-if="loading" kind="form" :label="t('mcp.loading')" />
    <div
      v-else-if="loadFailed"
      class="rounded-2xl border border-dashed border-input px-6 py-16 text-center"
    >
      <h2 class="text-lg font-semibold">{{ t('mcp.notFound') }}</h2>
      <button class="ag-btn ag-btn-info mt-5" type="button" @click="goBack">
        {{ t('mcp.backToList') }}
      </button>
    </div>
    <form v-else class="space-y-4" @submit.prevent="saveServer">
      <label class="block text-sm font-medium">
        {{ t('mcp.group') }}
        <input
          v-model="form.groupName"
          required
          maxlength="255"
          class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          :placeholder="t('mcp.groupPlaceholder')"
        />
      </label>
      <label class="block text-sm font-medium">
        {{ t('mcp.name') }}
        <input
          v-model="form.name"
          required
          maxlength="255"
          class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <label class="block text-sm font-medium">
        {{ t('mcp.endpointUrl') }}
        <input
          v-model="form.endpointUrl"
          required
          maxlength="2048"
          type="url"
          :placeholder="t('mcp.endpointUrlPlaceholder')"
          class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <div class="ag-field-grid">
        <label class="block text-sm font-medium">
          {{ t('mcp.authType') }}
          <select
            v-model="form.authType"
            class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="item in mcpAuthTypes" :key="item" :value="item">
              {{ t(`mcp.authTypes.${item}`) }}
            </option>
          </select>
        </label>
        <label class="block text-sm font-medium">
          {{ t('mcp.protocolVersion') }}
          <input
            v-model="form.protocolVersion"
            maxlength="32"
            :placeholder="t('mcp.protocolVersionPlaceholder')"
            class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>
      <label v-if="showAuthHeaderName" class="block text-sm font-medium">
        {{ t('mcp.authHeaderName') }}
        <input
          v-model="form.authHeaderName"
          maxlength="255"
          :placeholder="t('mcp.authHeaderNamePlaceholder')"
          class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <label v-if="showAuthToken" class="block text-sm font-medium">
        {{ t('mcp.authToken') }}
        <input
          v-model="form.authToken"
          maxlength="4000"
          type="password"
          autocomplete="off"
          class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <label class="block text-sm font-medium">
        {{ t('mcp.descriptionLabel') }}
        <textarea
          v-model="form.description"
          maxlength="2000"
          rows="2"
          class="mt-2 w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <JsonEditor
        v-model="form.customHeaders"
        :label="t('mcp.customHeaders')"
        placeholder='{"X-Tenant":"demo"}'
        expect="string-map"
      />
      <p class="text-xs text-muted-foreground">{{ t('mcp.customHeadersHint') }}</p>
      <label class="flex items-center gap-2 text-sm font-medium">
        <input v-model="form.enabled" type="checkbox" class="size-4 rounded border-input" />
        {{ t('mcp.enabled') }}
      </label>
    </form>
  </section>
</template>
