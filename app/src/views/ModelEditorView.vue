<script setup lang="ts">
import { parseJson, toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import ContentSkeleton from '../components/ContentSkeleton.vue';
import JsonEditor from '../components/JsonEditor.vue';
import { modelFailureI18n, modelTypes, useModels, type ModelType } from '../composables/useModels';

const providerSuggestions = [
  'openai',
  'anthropic',
  'azure',
  'gemini',
  'ollama',
  'deepseek',
  'qwen',
  'openrouter',
];

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { getModel, createModel, updateModel } = useModels();

const saving = ref(false);
const loading = ref(false);
const loadFailed = ref(false);
const form = reactive({
  groupName: 'default',
  name: '',
  provider: '',
  type: 'LLM' as ModelType,
  description: '',
  configuration: '{}',
});

const modelId = computed(() => {
  const raw = route.params.id;
  return typeof raw === 'string' ? raw : null;
});
const isCreate = computed(() => !modelId.value);
const pageTitle = computed(() => t(isCreate.value ? 'models.createModel' : 'models.editModel'));
const canSave = computed(
  () => Boolean(form.groupName.trim() && form.name.trim() && form.provider.trim()) && !saving.value,
);

onMounted(async () => {
  if (!modelId.value) {
    const requested = route.query.type;
    if (typeof requested === 'string' && modelTypes.includes(requested as ModelType)) {
      form.type = requested as ModelType;
    }
    return;
  }
  loading.value = true;
  try {
    const model = await getModel(modelId.value);
    form.groupName = model.groupName;
    form.name = model.name;
    form.provider = model.provider;
    form.type = model.type;
    form.description = model.description;
    form.configuration = JSON.stringify(model.configuration ?? {}, null, 2);
    loadFailed.value = false;
  } catch (caught) {
    loadFailed.value = true;
    toastError(t(modelFailureI18n(caught, 'load')), t('toast.error'));
  } finally {
    loading.value = false;
  }
});

function goBack() {
  void router.push({ name: 'console-models' });
}

function parseConfiguration(): Record<string, unknown> | null {
  const parsed = parseJson(form.configuration, 'object');
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

async function saveModel() {
  if (!canSave.value) return;
  const configuration = parseConfiguration();
  if (!configuration) {
    toastError(t('models.configurationInvalid'), t('toast.error'));
    return;
  }
  saving.value = true;
  const input = {
    groupName: form.groupName,
    name: form.name,
    provider: form.provider,
    type: form.type,
    description: form.description,
    configuration,
  };
  try {
    if (modelId.value) {
      await updateModel(modelId.value, input);
      toastSuccess(t('models.updated', { name: form.name.trim() }), t('toast.success'));
    } else {
      await createModel(input);
      toastSuccess(t('models.created', { name: form.name.trim() }), t('toast.success'));
    }
    goBack();
  } catch (caught) {
    toastError(t(modelFailureI18n(caught)), t('toast.error'));
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
          :aria-label="t('models.backToList')"
          @click="goBack"
        >
          <Icon icon="lucide:arrow-left" width="18" height="18" aria-hidden="true" />
        </button>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">{{ pageTitle }}</h1>
          <p class="mt-1.5 text-sm text-muted-foreground">{{ t('models.description') }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 self-end sm:self-auto">
        <button type="button" class="ag-btn ag-btn-ghost" @click="goBack">
          {{ t('models.cancel') }}
        </button>
        <button
          type="button"
          class="ag-btn ag-btn-success"
          :disabled="!canSave || loading || loadFailed"
          @click="saveModel"
        >
          <Icon icon="lucide:save" width="16" height="16" aria-hidden="true" />
          {{ saving ? t('models.saving') : t('models.save') }}
        </button>
      </div>
    </div>

    <ContentSkeleton v-if="loading" kind="form" :label="t('models.loading')" />
    <div
      v-else-if="loadFailed"
      class="rounded-2xl border border-dashed border-input px-6 py-16 text-center"
    >
      <h2 class="text-lg font-semibold">{{ t('models.notFound') }}</h2>
      <button class="ag-btn ag-btn-info mt-5" type="button" @click="goBack">
        {{ t('models.backToList') }}
      </button>
    </div>
    <form v-else class="space-y-4" @submit.prevent="saveModel">
      <label class="block text-sm font-medium">
        {{ t('models.group') }}
        <input
          v-model="form.groupName"
          required
          maxlength="255"
          class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          :placeholder="t('models.groupPlaceholder')"
        />
      </label>
      <label class="block text-sm font-medium">
        {{ t('models.name') }}
        <input
          v-model="form.name"
          required
          maxlength="255"
          class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <div class="ag-field-grid">
        <label class="block text-sm font-medium">
          {{ t('models.provider') }}
          <input
            v-model="form.provider"
            required
            maxlength="255"
            list="model-providers"
            :placeholder="t('models.providerPlaceholder')"
            class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          />
          <datalist id="model-providers">
            <option v-for="item in providerSuggestions" :key="item" :value="item" />
          </datalist>
        </label>
        <label class="block text-sm font-medium">
          {{ t('models.type') }}
          <select
            v-model="form.type"
            class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="item in modelTypes" :key="item" :value="item">
              {{ t(`models.types.${item}`) }}
            </option>
          </select>
        </label>
      </div>
      <label class="block text-sm font-medium">
        {{ t('models.descriptionLabel') }}
        <textarea
          v-model="form.description"
          maxlength="2000"
          rows="2"
          class="mt-2 w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <JsonEditor
        v-model="form.configuration"
        :label="t('models.configuration')"
        placeholder='{"model":"gpt-4o-mini"}'
        expect="object"
      />
      <p class="text-xs text-muted-foreground">{{ t('models.configurationHint') }}</p>
    </form>
  </section>
</template>
