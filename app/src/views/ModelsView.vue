<script setup lang="ts">
import { toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmActionDialog from '../components/ConfirmActionDialog.vue';
import ModelCard from '../components/ModelCard.vue';
import ModelFormDialog from '../components/ModelFormDialog.vue';
import type { ManagedModel, ModelType } from '../composables/useModels';
import { modelFailureI18n, modelTypes, useModels } from '../composables/useModels';

type TypeFilter = ModelType | 'ALL';

const filters: TypeFilter[] = ['ALL', ...modelTypes];

const { t } = useI18n();
const { models, refreshModels, createModel, updateModel, removeModel } = useModels();

const typeFilter = ref<TypeFilter>('ALL');
const dialogOpen = ref(false);
const editing = ref<ManagedModel | null>(null);
const modelToDelete = ref<ManagedModel | null>(null);
const deletingModelId = ref<string | null>(null);
const saving = ref(false);
const loading = ref(false);
const loadFailed = ref(false);
const form = reactive({
  name: '',
  provider: '',
  type: 'LLM' as ModelType,
  description: '',
  configuration: '{}',
});

const visibleModels = computed(() =>
  typeFilter.value === 'ALL'
    ? models.value
    : models.value.filter((model) => model.type === typeFilter.value),
);
const dialogTitle = computed(() => t(editing.value ? 'models.editModel' : 'models.createModel'));

onMounted(() => {
  void reload();
});

async function reload() {
  loading.value = true;
  try {
    await refreshModels();
    loadFailed.value = false;
  } catch (caught) {
    loadFailed.value = true;
    toastError(t(modelFailureI18n(caught, 'load')), t('toast.error'));
  } finally {
    loading.value = false;
  }
}

function resetForm(model?: ManagedModel | null) {
  editing.value = model ?? null;
  form.name = model?.name ?? '';
  form.provider = model?.provider ?? '';
  form.type = model?.type ?? (typeFilter.value === 'ALL' ? 'LLM' : typeFilter.value);
  form.description = model?.description ?? '';
  form.configuration = JSON.stringify(model?.configuration ?? {}, null, 2);
}

function openCreate() {
  resetForm(null);
  dialogOpen.value = true;
}

function openEdit(model: ManagedModel) {
  resetForm(model);
  dialogOpen.value = true;
}

function parseConfiguration(): Record<string, unknown> | null {
  const raw = form.configuration.trim() || '{}';
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function saveModel() {
  if (!form.name.trim() || !form.provider.trim() || saving.value) return;
  const configuration = parseConfiguration();
  if (!configuration) {
    toastError(t('models.configurationInvalid'), t('toast.error'));
    return;
  }
  saving.value = true;
  const input = {
    name: form.name,
    provider: form.provider,
    type: form.type,
    description: form.description,
    configuration,
  };
  try {
    if (editing.value) {
      await updateModel(editing.value.id, input);
      toastSuccess(t('models.updated', { name: form.name.trim() }), t('toast.success'));
    } else {
      await createModel(input);
      toastSuccess(t('models.created', { name: form.name.trim() }), t('toast.success'));
    }
    if (typeFilter.value !== 'ALL') typeFilter.value = form.type;
    dialogOpen.value = false;
  } catch (caught) {
    toastError(t(modelFailureI18n(caught)), t('toast.error'));
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  if (!modelToDelete.value) return;
  deletingModelId.value = modelToDelete.value.id;
  try {
    await removeModel(modelToDelete.value.id);
    modelToDelete.value = null;
    toastSuccess(t('models.deleted'), t('toast.success'));
  } catch (caught) {
    toastError(t(modelFailureI18n(caught)), t('toast.error'));
  } finally {
    deletingModelId.value = null;
  }
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
          <Icon icon="lucide:brain" width="22" height="22" aria-hidden="true" />
        </div>
        <div>
          <h1 class="text-3xl font-semibold tracking-tight">{{ t('models.title') }}</h1>
          <p class="mt-2 text-muted-foreground">{{ t('models.description') }}</p>
        </div>
      </div>
      <button
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20"
        type="button"
        @click="openCreate"
      >
        <Icon icon="lucide:plus" width="18" height="18" aria-hidden="true" />
        {{ t('models.createModel') }}
      </button>
    </div>

    <div class="mb-6 flex flex-wrap gap-2" role="tablist" :aria-label="t('models.typesLabel')">
      <button
        v-for="item in filters"
        :key="item"
        type="button"
        role="tab"
        class="rounded-full border px-3 py-1.5 text-sm font-medium"
        :class="
          item === typeFilter
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
        "
        :aria-selected="item === typeFilter"
        @click="typeFilter = item"
      >
        {{ item === 'ALL' ? t('models.allTypes') : t(`models.types.${item}`) }}
      </button>
    </div>

    <p v-if="loading" class="text-sm text-muted-foreground">{{ t('models.loading') }}</p>
    <div
      v-else-if="loadFailed"
      class="rounded-2xl border border-dashed border-input px-6 py-16 text-center"
    >
      <h2 class="text-lg font-semibold">{{ t('models.loadError') }}</h2>
      <button
        class="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        type="button"
        @click="reload"
      >
        {{ t('models.retry') }}
      </button>
    </div>
    <div v-else-if="visibleModels.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <ModelCard
        v-for="(model, index) in visibleModels"
        :key="model.id"
        :model="model"
        :index="index"
        :deleting="deletingModelId === model.id"
        @edit="openEdit(model)"
        @remove="modelToDelete = model"
      />
    </div>
    <div v-else class="rounded-2xl border border-dashed border-input px-6 py-16 text-center">
      <h2 class="text-lg font-semibold">
        {{ typeFilter === 'ALL' ? t('models.emptyTitle') : t('models.emptyFilteredTitle') }}
      </h2>
      <p class="mt-2 text-sm text-muted-foreground">
        {{
          typeFilter === 'ALL'
            ? t('models.emptyDescription')
            : t('models.emptyFilteredDescription', { type: t(`models.types.${typeFilter}`) })
        }}
      </p>
      <button
        class="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        type="button"
        @click="openCreate"
      >
        {{ t('models.createModel') }}
      </button>
    </div>

    <ModelFormDialog
      v-model:open="dialogOpen"
      v-model:name="form.name"
      v-model:provider="form.provider"
      v-model:type="form.type"
      v-model:description="form.description"
      v-model:configuration="form.configuration"
      :title="dialogTitle"
      :saving="saving"
      @save="saveModel"
    />
    <ConfirmActionDialog
      :open="Boolean(modelToDelete)"
      :title="t('models.delete')"
      :description="t('models.confirmDelete', { name: modelToDelete?.name ?? '' })"
      :confirm-label="t('models.delete')"
      @update:open="modelToDelete = $event ? modelToDelete : null"
      @confirm="confirmDelete"
    />
  </section>
</template>
