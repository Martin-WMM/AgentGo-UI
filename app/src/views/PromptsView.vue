<script setup lang="ts">
import { toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import ConfirmActionDialog from '../components/ConfirmActionDialog.vue';
import BatchDeleteBar from '../components/BatchDeleteBar.vue';
import ContentSkeleton from '../components/ContentSkeleton.vue';
import PromptTemplateTable from '../components/PromptTemplateTable.vue';
import { useBatchSelection } from '../composables/useBatchSelection';
import type { PromptTemplate } from '../composables/usePromptTemplates';
import {
  downloadPromptTemplate,
  promptFailureI18n,
  usePromptTemplates,
} from '../composables/usePromptTemplates';

const { t } = useI18n();
const router = useRouter();
const {
  templates,
  page,
  pageSize,
  totalElements,
  totalPages,
  first,
  last,
  refreshTemplates,
  removeTemplate,
  removeTemplates,
} = usePromptTemplates();

const templateToDelete = ref<PromptTemplate | null>(null);
const loading = ref(false);
const paging = ref(false);
const loadFailed = ref(false);
const visibleIds = computed(() => templates.value.map((template) => template.id));
const { selectedIds, toggle, toggleAll, clear, allSelected, count } = useBatchSelection(visibleIds);
const batchDeleteOpen = ref(false);
const batchDeleting = ref(false);

onMounted(() => {
  void loadPage(1);
});

async function loadPage(nextPage: number, nextSize = pageSize.value) {
  const initial = templates.value.length === 0;
  if (initial) loading.value = true;
  else paging.value = true;
  try {
    await refreshTemplates(nextPage, nextSize);
    loadFailed.value = false;
  } catch (caught) {
    if (templates.value.length === 0) loadFailed.value = true;
    toastError(t(promptFailureI18n(caught)), t('toast.error'));
  } finally {
    loading.value = false;
    paging.value = false;
  }
}

function openCreate() {
  void router.push({ name: 'prompt-template-create' });
}

function openHistory() {
  void router.push({ name: 'prompt-template-history' });
}

function openView(template: PromptTemplate) {
  void router.push({ name: 'prompt-template-view', params: { id: template.id } });
}

function openEdit(template: PromptTemplate) {
  void router.push({ name: 'prompt-template-edit', params: { id: template.id } });
}

function downloadTemplate(template: PromptTemplate) {
  downloadPromptTemplate(template);
  toastSuccess(t('prompts.downloaded', { name: template.name }), t('toast.success'));
}

async function confirmDelete() {
  if (!templateToDelete.value) return;
  const stepBack = templates.value.length === 1 && page.value > 1;
  const nextPage = stepBack ? page.value - 1 : page.value;
  try {
    await removeTemplate(templateToDelete.value.id);
    templateToDelete.value = null;
    toastSuccess(t('prompts.deleted'), t('toast.success'));
    await loadPage(nextPage);
  } catch (caught) {
    toastError(t(promptFailureI18n(caught)), t('toast.error'));
  }
}

async function confirmBatchDelete() {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  const remaining = templates.value.filter((template) => !ids.includes(template.id)).length;
  const stepBack = remaining === 0 && page.value > 1;
  const nextPage = stepBack ? page.value - 1 : page.value;
  batchDeleting.value = true;
  try {
    await removeTemplates(ids);
    clear();
    batchDeleteOpen.value = false;
    toastSuccess(t('selection.deleted', { count: ids.length }), t('toast.success'));
    await loadPage(nextPage);
  } catch (caught) {
    toastError(t(promptFailureI18n(caught)), t('toast.error'));
  } finally {
    batchDeleting.value = false;
  }
}

function retryLoad() {
  void loadPage(page.value);
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
          <Icon icon="lucide:message-square-text" width="22" height="22" aria-hidden="true" />
        </div>
        <div>
          <h1 class="text-3xl font-semibold tracking-tight">{{ t('prompts.title') }}</h1>
          <p class="mt-2 text-muted-foreground">{{ t('prompts.description') }}</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <button class="ag-btn ag-btn-outline" type="button" @click="openHistory">
          <Icon icon="lucide:history" width="18" height="18" aria-hidden="true" />
          {{ t('prompts.history') }}
        </button>
        <button class="ag-btn ag-btn-primary" type="button" @click="openCreate">
          <Icon icon="lucide:plus" width="18" height="18" aria-hidden="true" />
          {{ t('prompts.createTemplate') }}
        </button>
      </div>
    </div>

    <BatchDeleteBar
      v-if="!loading && !loadFailed"
      :count="count"
      :total="templates.length"
      :all-selected="allSelected"
      :deleting="batchDeleting"
      @toggle-all="toggleAll"
      @remove="batchDeleteOpen = true"
    />

    <ContentSkeleton v-if="loading" kind="table" :label="t('prompts.loading')" />
    <div
      v-else-if="loadFailed"
      class="rounded-2xl border border-dashed border-input px-6 py-16 text-center"
    >
      <h2 class="text-lg font-semibold">{{ t('prompts.loadError') }}</h2>
      <button class="ag-btn ag-btn-info mt-5" type="button" @click="retryLoad">
        {{ t('prompts.retry') }}
      </button>
    </div>
    <PromptTemplateTable
      v-else-if="templates.length"
      :templates="templates"
      :page="page"
      :page-size="pageSize"
      :total-elements="totalElements"
      :total-pages="totalPages"
      :first="first"
      :last="last"
      :paging="paging"
      :selected-ids="selectedIds"
      @view="openView"
      @download="downloadTemplate"
      @edit="openEdit"
      @remove="templateToDelete = $event"
      @toggle="toggle"
      @page="loadPage"
      @page-size="loadPage(1, $event)"
    />
    <div v-else class="rounded-2xl border border-dashed border-input px-6 py-16 text-center">
      <div
        class="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
      >
        <Icon icon="lucide:sparkles" width="22" height="22" aria-hidden="true" />
      </div>
      <h2 class="text-lg font-semibold">{{ t('prompts.emptyTitle') }}</h2>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('prompts.emptyDescription') }}</p>
      <button class="ag-btn ag-btn-primary mt-5" type="button" @click="openCreate">
        {{ t('prompts.createTemplate') }}
      </button>
    </div>

    <ConfirmActionDialog
      :open="Boolean(templateToDelete)"
      :title="t('prompts.delete')"
      :description="t('prompts.confirmDelete', { name: templateToDelete?.name ?? '' })"
      :confirm-label="t('prompts.delete')"
      @update:open="templateToDelete = $event ? templateToDelete : null"
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
