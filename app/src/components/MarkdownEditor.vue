<script setup lang="ts">
import { MarkdownEditor as Editor } from '@agentgo/ui';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    placeholder?: string;
    emptyText?: string;
    highlightPlaceholders?: boolean;
  }>(),
  { highlightPlaceholders: false },
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
</script>

<template>
  <Editor
    :model-value="modelValue"
    :label="label ?? t('editor.content')"
    :placeholder="placeholder"
    :empty-text="emptyText ?? t('editor.markdownEmpty')"
    :modes-label="t('editor.modes')"
    :mode-labels="modeLabels"
    :highlight-placeholders="highlightPlaceholders"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
