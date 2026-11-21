<script setup lang="ts">
import { MarkdownViewer, ResourceIcon, toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import ContentSkeleton from '../components/ContentSkeleton.vue';
import type { PromptTemplate } from '../composables/usePromptTemplates';
import {
  downloadPromptTemplate,
  promptFailureI18n,
  usePromptTemplates,
} from '../composables/usePromptTemplates';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const { getTemplate } = usePromptTemplates();

const loading = ref(true);
const loadFailed = ref(false);
const template = ref<PromptTemplate | null>(null);

const templateId = computed(() => {
  const raw = route.params.id;
  return typeof raw === 'string' ? raw : '';
});

onMounted(async () => {
  if (!templateId.value) {
    loadFailed.value = true;
    loading.value = false;
    return;
  }
  try {
    template.value = await getTemplate(templateId.value);
    loadFailed.value = false;
  } catch (caught) {
    loadFailed.value = true;
    toastError(t(promptFailureI18n(caught)), t('toast.error'));
  } finally {
    loading.value = false;
  }
});

function goBack() {
  void router.push({ name: 'console-prompts' });
}

function openEdit() {
  if (!template.value) return;
  void router.push({ name: 'prompt-template-edit', params: { id: template.value.id } });
}

function downloadTemplate() {
  if (!template.value) return;
  downloadPromptTemplate(template.value);
  toastSuccess(t('prompts.downloaded', { name: template.value.name }), t('toast.success'));
}

function formatUpdatedAt(value: string) {
  return new Date(value).toLocaleString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <section
    class="flex w-full min-w-0 max-w-full flex-col px-4 py-4 sm:px-6 lg:h-[calc(100dvh-11.75rem)] lg:min-h-[calc(100dvh-11.75rem)]"
  >
    <div class="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex min-w-0 items-center gap-3">
        <button
          type="button"
          class="rounded-xl border border-input p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          :aria-label="t('prompts.backToList')"
          @click="goBack"
        >
          <Icon icon="lucide:arrow-left" width="18" height="18" aria-hidden="true" />
        </button>
        <div class="min-w-0">
          <h1 class="truncate text-xl font-semibold tracking-tight sm:text-2xl">
            {{ template?.name || t('prompts.viewTemplate') }}
          </h1>
          <p class="mt-0.5 truncate text-sm text-muted-foreground">
            {{ t('prompts.viewDescription') }}
          </p>
        </div>
      </div>
      <div v-if="template" class="flex items-center gap-2 self-end sm:self-auto">
        <button type="button" class="ag-btn ag-btn-outline" @click="downloadTemplate">
          <Icon icon="lucide:download" width="16" height="16" aria-hidden="true" />
          {{ t('prompts.download') }}
        </button>
        <button
          type="button"
          class="ag-btn text-white"
          :style="{ backgroundColor: template.color }"
          @click="openEdit"
        >
          <Icon icon="lucide:pencil" width="16" height="16" aria-hidden="true" />
          {{ t('prompts.edit') }}
        </button>
      </div>
    </div>

    <ContentSkeleton v-if="loading" kind="form" :label="t('prompts.loading')" />
    <div
      v-else-if="loadFailed || !template"
      class="rounded-2xl border border-dashed border-input px-6 py-16 text-center"
    >
      <h2 class="text-lg font-semibold">{{ t('prompts.notFound') }}</h2>
      <button class="ag-btn ag-btn-info mt-5" type="button" @click="goBack">
        {{ t('prompts.backToList') }}
      </button>
    </div>
    <div v-else class="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div
        class="min-h-[32rem] overflow-auto rounded-2xl border border-input bg-card px-5 py-4 lg:h-full lg:min-h-0"
      >
        <MarkdownViewer
          :source="template.content"
          :empty-text="t('prompts.markdownPreviewEmpty')"
        />
      </div>
      <aside class="min-h-0 space-y-4 overflow-y-auto rounded-2xl border border-input bg-card p-4">
        <div class="flex items-center gap-3">
          <span
            class="flex size-10 shrink-0 items-center justify-center rounded-xl text-white"
            :style="{ backgroundColor: template.color }"
          >
            <ResourceIcon v-if="template.icon" :icon="template.icon" :size="18" />
            <Icon
              v-else
              icon="lucide:message-square-text"
              width="18"
              height="18"
              aria-hidden="true"
            />
          </span>
          <h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {{ t('prompts.basicInfo') }}
          </h2>
        </div>
