<script setup lang="ts">
import { JsonEditor as Editor, type JsonExpect } from '@agentgo/ui';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    placeholder?: string;
    expect?: JsonExpect;
  }>(),
  { expect: 'value' },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useI18n();
const modeLabels = computed(() => ({
  split: t('editor.split'),
  write: t('editor.write'),
  preview: t('editor.preview'),
}));
const errorLabels = computed(() => ({
  invalid: t('editor.jsonInvalid'),
  object: t('editor.jsonObject'),
  'string-map': t('editor.jsonStringMap'),
}));
</script>

<template>
  <Editor
    :model-value="modelValue"
    :label="label ?? t('editor.json')"
    :placeholder="placeholder"
    :empty-text="t('editor.jsonEmpty')"
    :modes-label="t('editor.modes')"
    :format-label="t('editor.format')"
    :mode-labels="modeLabels"
    :error-labels="errorLabels"
    :expect="expect"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
