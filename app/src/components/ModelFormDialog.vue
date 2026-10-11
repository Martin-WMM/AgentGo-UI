<script setup lang="ts">
import { Dialog } from '@agentgo/ui';
import { useI18n } from 'vue-i18n';

import { modelTypes, type ModelType } from '../composables/useModels';

defineProps<{
  open: boolean;
  title: string;
  name: string;
  provider: string;
  type: ModelType;
  description: string;
  configuration: string;
  saving?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
  'update:name': [value: string];
  'update:provider': [value: string];
  'update:type': [value: ModelType];
  'update:description': [value: string];
  'update:configuration': [value: string];
  save: [];
}>();

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
const fieldClass =
  'mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring';
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <form class="max-h-[80vh] overflow-y-auto pr-1" @submit.prevent="emit('save')">
      <h2 class="text-xl font-semibold">{{ title }}</h2>
      <div class="mt-5 space-y-4">
        <label class="block text-sm font-medium">
          {{ t('models.name') }}
          <input
            :value="name"
            required
            maxlength="255"
            :class="fieldClass"
            @input="emit('update:name', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block text-sm font-medium">
            {{ t('models.provider') }}
            <input
              :value="provider"
              required
              maxlength="255"
              list="model-providers"
              :placeholder="t('models.providerPlaceholder')"
              :class="fieldClass"
              @input="emit('update:provider', ($event.target as HTMLInputElement).value)"
            />
            <datalist id="model-providers">
              <option v-for="item in providerSuggestions" :key="item" :value="item" />
            </datalist>
          </label>
          <label class="block text-sm font-medium">
            {{ t('models.type') }}
            <select
              :value="type"
              :class="fieldClass"
              @change="emit('update:type', ($event.target as HTMLSelectElement).value as ModelType)"
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
            :value="description"
            maxlength="2000"
            rows="2"
            class="mt-2 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            @input="emit('update:description', ($event.target as HTMLTextAreaElement).value)"
          />
        </label>
        <label class="block text-sm font-medium">
          {{ t('models.configuration') }}
          <textarea
            :value="configuration"
            required
            rows="6"
            spellcheck="false"
            class="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
            @input="emit('update:configuration', ($event.target as HTMLTextAreaElement).value)"
          />
        </label>
        <p class="text-xs text-muted-foreground">{{ t('models.configurationHint') }}</p>
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <button
          class="rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent"
          type="button"
          @click="emit('update:open', false)"
        >
          {{ t('models.cancel') }}
        </button>
        <button
          class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          type="submit"
          :disabled="saving"
        >
          {{ saving ? t('models.saving') : t('models.save') }}
        </button>
      </div>
    </form>
  </Dialog>
</template>
