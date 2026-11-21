<script setup lang="ts">
import { parseJson, toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import ContentSkeleton from '../components/ContentSkeleton.vue';
import JsonEditor from '../components/JsonEditor.vue';
import {
  a2aAgentStatuses,
  a2aFailureI18n,
  useA2aAgents,
  type A2aAgentStatus,
} from '../composables/useA2aAgents';

const tagMaxCount = 16;
const tagMaxLength = 32;

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { getAgent, createAgent, updateAgent } = useA2aAgents();

const saving = ref(false);
const loading = ref(false);
const loadFailed = ref(false);
const tagDraft = ref('');
const tagError = ref('');
const descriptionVectorLength = ref(0);
const form = reactive({
  groupName: 'default',
  name: '',
  cardUrl: '',
  description: '',
  tags: [] as string[],
  metadata: '{}',
  enabled: true,
  status: 'UNKNOWN' as A2aAgentStatus,
});

const agentId = computed(() => {
  const raw = route.params.id;
  return typeof raw === 'string' ? raw : null;
});
const isCreate = computed(() => !agentId.value);
const pageTitle = computed(() => t(isCreate.value ? 'a2a.createAgent' : 'a2a.editAgent'));
const canSave = computed(
  () => Boolean(form.groupName.trim() && form.name.trim() && form.cardUrl.trim()) && !saving.value,
);

onMounted(async () => {
  if (!agentId.value) return;
  loading.value = true;
  try {
    const agent = await getAgent(agentId.value);
    form.groupName = agent.groupName;
    form.name = agent.name;
    form.cardUrl = agent.cardUrl;
    form.description = agent.description;
    form.tags = [...agent.tags];
    form.metadata = JSON.stringify(agent.metadata ?? {}, null, 2);
    form.enabled = agent.enabled;
    form.status = agent.status;
    descriptionVectorLength.value = agent.descriptionVector.length;
    loadFailed.value = false;
  } catch (caught) {
    loadFailed.value = true;
    toastError(t(a2aFailureI18n(caught, 'load')), t('toast.error'));
  } finally {
    loading.value = false;
  }
});

function goBack() {
  void router.push({ name: 'console-a2a' });
}

function hasControlCharacter(value: string) {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code <= 31 || code === 127) return true;
  }
  return false;
}

function addTag() {
  const tag = tagDraft.value.trim();
  tagError.value = '';
  if (!tag) return true;
  if (tag.includes(',') || hasControlCharacter(tag)) {
    tagError.value = t('a2a.tagInvalid');
    return false;
  }
  if (tag.length > tagMaxLength) {
    tagError.value = t('a2a.tagTooLong');
    return false;
  }
  if (form.tags.includes(tag)) {
    tagDraft.value = '';
    return true;
  }
  if (form.tags.length >= tagMaxCount) {
    tagError.value = t('a2a.tagLimit');
    return false;
  }
  form.tags.push(tag);
  tagDraft.value = '';
  return true;
}

function removeTag(tag: string) {
  form.tags = form.tags.filter((item) => item !== tag);
}

function parseMetadata(): Record<string, unknown> | null {
  const parsed = parseJson(form.metadata, 'object');
  if (
    !parsed.ok ||
    !parsed.value ||
    typeof parsed.value !== 'object' ||
    Array.isArray(parsed.value)
  ) {
    return null;
  }
  return parsed.value as Record<string, unknown>;
}

async function saveAgent() {
  if (!addTag() || !canSave.value) return;
  const metadata = parseMetadata();
  if (!metadata) {
    toastError(t('a2a.metadataInvalid'), t('toast.error'));
    return;
  }
  saving.value = true;
  const input = {
    groupName: form.groupName,
    name: form.name,
    cardUrl: form.cardUrl,
    description: form.description,
    tags: [...form.tags],
    metadata,
    enabled: form.enabled,
    status: form.status,
  };
  try {
    if (agentId.value) {
      await updateAgent(agentId.value, input);
      toastSuccess(t('a2a.updated', { name: form.name.trim() }), t('toast.success'));
    } else {
      await createAgent(input);
      toastSuccess(t('a2a.created', { name: form.name.trim() }), t('toast.success'));
    }
    goBack();
  } catch (caught) {
    toastError(t(a2aFailureI18n(caught)), t('toast.error'));
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
          :aria-label="t('a2a.backToList')"
          @click="goBack"
        >
          <Icon icon="lucide:arrow-left" width="18" height="18" aria-hidden="true" />
        </button>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">{{ pageTitle }}</h1>
          <p class="mt-1.5 text-sm text-muted-foreground">{{ t('a2a.formHint') }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 self-end sm:self-auto">
        <button type="button" class="ag-btn ag-btn-ghost" @click="goBack">
          {{ t('a2a.cancel') }}
        </button>
        <button
          type="button"
          class="ag-btn ag-btn-success"
          :disabled="!canSave || loading || loadFailed"
          @click="saveAgent"
        >
          <Icon icon="lucide:save" width="16" height="16" aria-hidden="true" />
          {{ saving ? t('a2a.saving') : t('a2a.save') }}
        </button>
      </div>
    </div>

    <ContentSkeleton v-if="loading" kind="form" :label="t('a2a.loading')" />
    <div
      v-else-if="loadFailed"
      class="rounded-2xl border border-dashed border-input px-6 py-16 text-center"
    >
      <h2 class="text-lg font-semibold">{{ t('a2a.notFound') }}</h2>
      <button class="ag-btn ag-btn-info mt-5" type="button" @click="goBack">
        {{ t('a2a.backToList') }}
      </button>
    </div>
    <form v-else class="space-y-4" @submit.prevent="saveAgent">
      <label class="block text-sm font-medium">
        {{ t('a2a.group') }}
        <input
          v-model="form.groupName"
          required
          maxlength="255"
          class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          :placeholder="t('a2a.groupPlaceholder')"
        />
      </label>
      <label class="block text-sm font-medium">
        {{ t('a2a.name') }}
        <input
          v-model="form.name"
          required
          maxlength="255"
          class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <label class="block text-sm font-medium">
        {{ t('a2a.cardUrl') }}
        <input
          v-model="form.cardUrl"
          required
          maxlength="2048"
          type="url"
          :placeholder="t('a2a.cardUrlPlaceholder')"
          class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <div class="ag-field-grid">
        <label class="block text-sm font-medium">
          {{ t('a2a.status') }}
          <select
            v-model="form.status"
            class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="item in a2aAgentStatuses" :key="item" :value="item">
              {{ t(`a2a.statuses.${item}`) }}
            </option>
          </select>
        </label>
        <label class="flex items-end gap-2 pb-2.5 text-sm font-medium">
          <input v-model="form.enabled" type="checkbox" class="size-4 rounded border-input" />
          {{ t('a2a.enabled') }}
        </label>
      </div>
      <label class="block text-sm font-medium">
        {{ t('a2a.descriptionLabel') }}
        <textarea
          v-model="form.description"
          maxlength="4000"
          rows="3"
          class="mt-2 w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
        <span class="mt-1.5 block text-xs font-normal text-muted-foreground">
          {{ t('a2a.descriptionVectorHint') }}
        </span>
      </label>
      <p v-if="!isCreate && descriptionVectorLength > 0" class="text-xs text-muted-foreground">
        {{ t('a2a.descriptionVectorLength', { count: descriptionVectorLength }) }}
      </p>
      <label class="block text-sm font-medium">
        {{ t('a2a.tags') }}
        <div v-if="form.tags.length" class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="tag in form.tags"
            :key="tag"
            type="button"
            class="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/80"
            :aria-label="t('a2a.removeTag', { tag })"
            @click="removeTag(tag)"
          >
            {{ tag }}
            <Icon icon="lucide:x" width="12" height="12" aria-hidden="true" />
          </button>
        </div>
        <input
          v-model="tagDraft"
          maxlength="32"
          class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          :placeholder="t('a2a.tagsPlaceholder')"
          @keydown.enter.prevent="addTag"
          @keydown.,.prevent="addTag"
          @blur="addTag"
        />
        <p class="mt-1.5 text-xs font-normal text-muted-foreground">{{ t('a2a.tagsHint') }}</p>
        <p v-if="tagError" class="mt-1 text-xs text-destructive">{{ tagError }}</p>
      </label>
      <JsonEditor
        v-model="form.metadata"
        :label="t('a2a.metadata')"
        placeholder='{"team":"ops"}'
