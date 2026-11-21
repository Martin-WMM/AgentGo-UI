<script setup lang="ts">
import { toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import ColorSwatchPicker from '../components/ColorSwatchPicker.vue';
import ContentSkeleton from '../components/ContentSkeleton.vue';
import { workspaceFailureI18n, useWorkspaces } from '../composables/useWorkspaces';
import { DEFAULT_WORKSPACE_COLOR } from '../lib/workspaceColors';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { loadWorkspace, createWorkspace, updateWorkspace } = useWorkspaces();

const saving = ref(false);
const loading = ref(false);
const loadFailed = ref(false);
const form = reactive({
  groupName: 'default',
  name: '',
  description: '',
  color: DEFAULT_WORKSPACE_COLOR,
});

const workspaceId = computed(() => {
  const raw = route.params.workspaceId;
  return typeof raw === 'string' ? raw : null;
});
const isCreate = computed(() => !workspaceId.value);
const pageTitle = computed(() =>
  t(isCreate.value ? 'files.createWorkspace' : 'files.editWorkspace'),
);
const canSave = computed(() => Boolean(form.groupName.trim() && form.name.trim()) && !saving.value);

onMounted(async () => {
  if (!workspaceId.value) return;
  loading.value = true;
  try {
    const workspace = await loadWorkspace(workspaceId.value);
    form.groupName = workspace.groupName;
    form.name = workspace.name;
    form.description = workspace.description;
    form.color = workspace.color;
    loadFailed.value = false;
  } catch (caught) {
    loadFailed.value = true;
    toastError(t(workspaceFailureI18n(caught)), t('toast.error'));
  } finally {
    loading.value = false;
  }
});

function goBack() {
  void router.push({ name: 'console-files' });
}

async function saveWorkspace() {
  if (!canSave.value) return;
  saving.value = true;
  const name = form.name.trim();
  try {
    if (workspaceId.value) {
      await updateWorkspace(
        workspaceId.value,
        form.name,
        form.description,
        form.color,
        form.groupName,
      );
      toastSuccess(t('files.workspaceUpdated', { name }), t('toast.success'));
    } else {
      await createWorkspace(form.name, form.description, form.color, form.groupName);
      toastSuccess(t('files.workspaceCreated', { name }), t('toast.success'));
    }
    goBack();
  } catch (caught) {
    toastError(t(workspaceFailureI18n(caught)), t('toast.error'));
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
          :aria-label="t('files.back')"
          @click="goBack"
        >
          <Icon icon="lucide:arrow-left" width="18" height="18" aria-hidden="true" />
        </button>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">{{ pageTitle }}</h1>
          <p class="mt-1.5 text-sm text-muted-foreground">{{ t('files.description') }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 self-end sm:self-auto">
        <button type="button" class="ag-btn ag-btn-ghost" @click="goBack">
          {{ t('files.cancel') }}
        </button>
        <button
          type="button"
          class="ag-btn text-white"
          :style="{ backgroundColor: form.color }"
          :disabled="!canSave || loading || loadFailed"
          @click="saveWorkspace"
        >
          <Icon icon="lucide:save" width="16" height="16" aria-hidden="true" />
          {{ saving ? t('files.saving') : t('files.save') }}
        </button>
      </div>
    </div>

    <ContentSkeleton v-if="loading" kind="form" :label="t('files.loadingWorkspace')" />
    <div
      v-else-if="loadFailed"
      class="rounded-2xl border border-dashed border-input px-6 py-16 text-center"
    >
      <h2 class="text-lg font-semibold">{{ t('files.notFound') }}</h2>
      <button class="ag-btn ag-btn-info mt-5" type="button" @click="goBack">
        {{ t('files.back') }}
      </button>
    </div>
    <form v-else class="space-y-4" @submit.prevent="saveWorkspace">
      <label class="block text-sm font-medium">
        {{ t('files.workspaceGroup') }}
        <input
          v-model="form.groupName"
          required
          maxlength="255"
          class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          :placeholder="t('files.workspaceGroupPlaceholder')"
        />
      </label>
      <label class="block text-sm font-medium">
        {{ t('files.workspaceName') }}
        <input
          v-model="form.name"
          required
          maxlength="80"
          class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <label class="block text-sm font-medium">
        {{ t('files.workspaceDescription') }}
        <textarea
          v-model="form.description"
          maxlength="300"
          rows="3"
          class="mt-2 w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <ColorSwatchPicker
        v-model="form.color"
        :legend="t('files.workspaceColor')"
        name="workspace-color"
      />
    </form>
  </section>
</template>
