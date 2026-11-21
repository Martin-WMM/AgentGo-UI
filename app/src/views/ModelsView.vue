<script setup lang="ts">
import { toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import ConfirmActionDialog from '../components/ConfirmActionDialog.vue';
import BatchDeleteBar from '../components/BatchDeleteBar.vue';
import ContentSkeleton from '../components/ContentSkeleton.vue';
import ModelCard from '../components/ModelCard.vue';
import type { ManagedModel, ModelType } from '../composables/useModels';
import { modelFailureI18n, modelTypes, useModels } from '../composables/useModels';
import { useBatchSelection } from '../composables/useBatchSelection';

type TypeFilter = ModelType | 'ALL';

const filters: TypeFilter[] = ['ALL', ...modelTypes];

const { t } = useI18n();
const router = useRouter();
const { models, refreshModels, removeModel, removeModels } = useModels();

const typeFilter = ref<TypeFilter>('ALL');
const modelToDelete = ref<ManagedModel | null>(null);
const deletingModelId = ref<string | null>(null);
const loading = ref(false);
const loadFailed = ref(false);

const visibleModels = computed(() =>
  typeFilter.value === 'ALL'
    ? models.value
    : models.value.filter((model) => model.type === typeFilter.value),
);
const visibleIds = computed(() => visibleModels.value.map((model) => model.id));
const { selectedIds, toggle, toggleAll, clear, allSelected, count } = useBatchSelection(visibleIds);
const batchDeleteOpen = ref(false);
const batchDeleting = ref(false);

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

function openCreate() {
  void router.push({
    name: 'model-create',
    query: typeFilter.value === 'ALL' ? {} : { type: typeFilter.value },
  });
}

function openEdit(model: ManagedModel) {
  void router.push({ name: 'model-edit', params: { id: model.id } });
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

async function confirmBatchDelete() {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  batchDeleting.value = true;
  try {
    await removeModels(ids);
    clear();
    batchDeleteOpen.value = false;
    toastSuccess(t('selection.deleted', { count: ids.length }), t('toast.success'));
  } catch (caught) {
    toastError(t(modelFailureI18n(caught)), t('toast.error'));
  } finally {
    batchDeleting.value = false;
  }
}
</script>

<template>
  <section class="ag-page">
    <div
      class="ag-hero relative mb-8 flex flex-col gap-4 overflow-hidden rounded-3xl p-6 sm:flex-row sm:items-end sm:justify-between"
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
      <button class="ag-btn ag-btn-primary" type="button" @click="openCreate">
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
        class="ag-chip rounded-full border px-3 py-1.5 text-sm font-medium"
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

    <BatchDeleteBar
      v-if="!loading && !loadFailed"
      :count="count"
      :total="visibleModels.length"
      :all-selected="allSelected"
      :deleting="batchDeleting"
      @toggle-all="toggleAll"
      @remove="batchDeleteOpen = true"
    />

    <ContentSkeleton v-if="loading" kind="cards" :label="t('models.loading')" />
    <div
      v-else-if="loadFailed"
      class="rounded-2xl border border-dashed border-input px-6 py-16 text-center"
    >
      <h2 class="text-lg font-semibold">{{ t('models.loadError') }}</h2>
      <button class="ag-btn ag-btn-info mt-5" type="button" @click="reload">
        {{ t('models.retry') }}
      </button>
    </div>
    <div v-else-if="visibleModels.length" class="ag-card-grid">
      <ModelCard
        v-for="(model, index) in visibleModels"
        :key="model.id"
        :model="model"
        :index="index"
        :deleting="deletingModelId === model.id"
        :selected="selectedIds.includes(model.id)"
        @edit="openEdit(model)"
        @remove="modelToDelete = model"
        @toggle="toggle(model.id)"
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
      <button class="ag-btn ag-btn-primary mt-5" type="button" @click="openCreate">
        {{ t('models.createModel') }}
      </button>
    </div>

    <ConfirmActionDialog
      :open="Boolean(modelToDelete)"
      :title="t('models.delete')"
      :description="t('models.confirmDelete', { name: modelToDelete?.name ?? '' })"
      :confirm-label="t('models.delete')"
      @update:open="modelToDelete = $event ? modelToDelete : null"
      @confirm="confirmDelete"
    />
    <ConfirmActionDialog
      :open="batchDeleteOpen"
      :title="t('selection.deleteSelected')"
      :description="t('selection.confirmDelete', { count })"
      :confirm-label="t('selection.deleteSelected')"
      @update:open="batchDeleteOpen = $event"
      @confirm="confirmBatchDelete"
    />
  </section>
</template>
