<script setup lang="ts">
import { toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import ConfirmActionDialog from '../components/ConfirmActionDialog.vue';
import PromptTemplateTable from '../components/PromptTemplateTable.vue';
import type { PromptTemplate } from '../composables/usePromptTemplates';
import { promptFailureI18n, usePromptTemplates } from '../composables/usePromptTemplates';

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
} = usePromptTemplates();

const templateToDelete = ref<PromptTemplate | null>(null);
const loading = ref(false);
const paging = ref(false);
const loadFailed = ref(false);

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

function openEdit(template: PromptTemplate) {
  void router.push({ name: 'prompt-template-edit', params: { id: template.id } });
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

function retryLoad() {
  void loadPage(page.value);
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
          <Icon icon="lucide:message-square-text" width="22" height="22" aria-hidden="true" />
        </div>
        <div>
          <h1 class="text-3xl font-semibold tracking-tight">{{ t('prompts.title') }}</h1>
          <p class="mt-2 text-muted-foreground">{{ t('prompts.description') }}</p>
        </div>
      </div>
      <button
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20"
        type="button"
        @click="openCreate"
      >
        <Icon icon="lucide:plus" width="18" height="18" aria-hidden="true" />
        {{ t('prompts.createTemplate') }}
      </button>
    </div>

    <p v-if="loading" class="text-sm text-muted-foreground">{{ t('prompts.loading') }}</p>
    <div
      v-else-if="loadFailed"
      class="rounded-2xl border border-dashed border-input px-6 py-16 text-center"
    >
      <h2 class="text-lg font-semibold">{{ t('prompts.loadError') }}</h2>
      <button
        class="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        type="button"
        @click="retryLoad"
      >
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
      @edit="openEdit"
      @remove="templateToDelete = $event"
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
      <button
        class="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        type="button"
        @click="openCreate"
      >
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
  </section>
</template>
