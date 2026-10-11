<script setup lang="ts">
import { toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import PromptMarkdownEditor from '../components/PromptMarkdownEditor.vue';
import type { PromptEngine } from '../composables/usePromptTemplates';
import { promptFailureI18n, usePromptTemplates } from '../composables/usePromptTemplates';

const engines: PromptEngine[] = ['SIMPLE', 'JINJA2'];

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { getTemplate, createTemplate, updateTemplate } = usePromptTemplates();

const saving = ref(false);
const loading = ref(false);
const loadFailed = ref(false);
const form = reactive({
  name: '',
  description: '',
  engine: 'SIMPLE' as PromptEngine,
  content: '',
});

const templateId = computed(() => {
  const raw = route.params.id;
  if (typeof raw !== 'string' || raw === 'new') return null;
  return raw;
});
const isCreate = computed(() => !templateId.value);
const pageTitle = computed(() =>
  t(isCreate.value ? 'prompts.createTemplate' : 'prompts.editTemplate'),
);
const canSave = computed(() => Boolean(form.name.trim() && form.content.trim()) && !saving.value);

onMounted(async () => {
  if (!templateId.value) return;
  loading.value = true;
  try {
    const template = await getTemplate(templateId.value);
    form.name = template.name;
    form.description = template.description;
    form.engine = template.engine;
    form.content = template.content;
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

async function saveTemplate() {
  if (!canSave.value) return;
  saving.value = true;
  const input = {
    name: form.name,
    description: form.description,
    engine: form.engine,
    content: form.content,
  };
  try {
    if (templateId.value) {
      await updateTemplate(templateId.value, input);
      toastSuccess(t('prompts.updated', { name: form.name.trim() }), t('toast.success'));
    } else {
      await createTemplate(input);
      toastSuccess(t('prompts.created', { name: form.name.trim() }), t('toast.success'));
    }
    goBack();
  } catch (caught) {
    toastError(t(promptFailureI18n(caught)), t('toast.error'));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="mx-auto min-h-[calc(100vh-129px)] w-full max-w-6xl px-4 py-8 sm:px-6">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-start gap-3">
        <button
          type="button"
          class="mt-0.5 rounded-xl border border-input p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          :aria-label="t('prompts.backToList')"
          @click="goBack"
        >
          <Icon icon="lucide:arrow-left" width="18" height="18" aria-hidden="true" />
        </button>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">{{ pageTitle }}</h1>
          <p class="mt-1.5 text-sm text-muted-foreground">{{ t('prompts.editorDescription') }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          class="rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-accent"
          @click="goBack"
        >
          {{ t('prompts.cancel') }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60"
          :disabled="!canSave || loading || loadFailed"
          @click="saveTemplate"
        >
          <Icon icon="lucide:save" width="16" height="16" aria-hidden="true" />
          {{ saving ? t('prompts.saving') : t('prompts.save') }}
        </button>
      </div>
    </div>

    <p v-if="loading" class="text-sm text-muted-foreground">{{ t('prompts.loading') }}</p>
    <div
      v-else-if="loadFailed"
      class="rounded-2xl border border-dashed border-input px-6 py-16 text-center"
    >
      <h2 class="text-lg font-semibold">{{ t('prompts.notFound') }}</h2>
      <button
        class="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        type="button"
        @click="goBack"
      >
        {{ t('prompts.backToList') }}
      </button>
    </div>
    <form v-else class="space-y-6" @submit.prevent="saveTemplate">
      <div class="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/5 via-background to-cyan-400/5 p-5 sm:p-6">
        <h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {{ t('prompts.basicInfo') }}
        </h2>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <label class="block text-sm font-medium md:col-span-1">
            {{ t('prompts.name') }}
            <input
              v-model="form.name"
              required
              maxlength="255"
              class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              :placeholder="t('prompts.namePlaceholder')"
            />
          </label>
          <label class="block text-sm font-medium md:col-span-1">
            {{ t('prompts.engine') }}
            <select
              v-model="form.engine"
              class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
            >
