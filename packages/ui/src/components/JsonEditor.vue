<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed, nextTick, ref, watch } from 'vue';

import {
  escapeHtml,
  formatJson,
  highlightJson,
  parseJson,
  type JsonExpect,
  type JsonParseError,
} from '../lib/markup';
import JsonViewer from './JsonViewer.vue';

type EditorMode = 'split' | 'write' | 'preview';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    placeholder?: string;
    emptyText?: string;
    modesLabel?: string;
    formatLabel?: string;
    modeLabels?: Partial<Record<EditorMode, string>>;
    errorLabels?: Partial<Record<JsonParseError, string>>;
    expect?: JsonExpect;
  }>(),
  {
    label: 'JSON',
    placeholder: '',
    emptyText: 'Nothing to preview yet.',
    modesLabel: 'Editor layout',
    formatLabel: 'Format',
    modeLabels: () => ({}),
    errorLabels: () => ({}),
    expect: 'value',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const mode = ref<EditorMode>('write');
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const overlayRef = ref<HTMLPreElement | null>(null);
const modes: EditorMode[] = ['split', 'write', 'preview'];

const labels = computed(() => ({
  split: props.modeLabels.split ?? 'Split',
  write: props.modeLabels.write ?? 'Write',
  preview: props.modeLabels.preview ?? 'Preview',
}));
const parsed = computed(() => parseJson(props.modelValue, props.expect));
const errorText = computed(() => {
  if (parsed.value.ok) return '';
  const error = parsed.value.error;
  if (error === 'object') return props.errorLabels.object ?? 'JSON must be an object.';
  if (error === 'string-map') {
    return props.errorLabels['string-map'] ?? 'Every JSON value must be a string.';
  }
  return props.errorLabels.invalid ?? 'This is not valid JSON.';
});
const highlightedSource = computed(() => {
  if (!props.modelValue) {
    return `<span class="ag-placeholder">${escapeHtml(props.placeholder)}</span>`;
  }
  return highlightJson(props.modelValue);
});

function syncScroll() {
  const textarea = textareaRef.value;
  const overlay = overlayRef.value;
  if (!textarea || !overlay) return;
  overlay.scrollTop = textarea.scrollTop;
  overlay.scrollLeft = textarea.scrollLeft;
}

watch(
  () => props.modelValue,
  async () => {
    await nextTick();
    syncScroll();
  },
);

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
}

function format() {
  const formatted = formatJson(props.modelValue);
  if (formatted === null) return;
  emit('update:modelValue', formatted);
}
</script>

<template>
  <div
    class="ag-json-editor flex min-h-[18rem] flex-col overflow-hidden rounded-2xl border bg-card"
    :class="errorText ? 'border-destructive/70' : 'border-input'"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-input/80 bg-accent/30 px-4 py-2.5"
    >
      <div class="flex items-center gap-2 text-sm font-medium">
        <Icon icon="lucide:braces" width="16" height="16" class="text-primary" aria-hidden="true" />
        {{ label }}
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          :disabled="!parsed.ok"
          @click="format"
        >
          {{ formatLabel }}
        </button>
        <div
          class="inline-flex rounded-xl border border-input bg-background p-0.5"
          role="tablist"
          :aria-label="modesLabel"
        >
          <button
            v-for="item in modes"
            :key="item"
            type="button"
            role="tab"
            class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            :class="
              mode === item
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            "
            :aria-selected="mode === item"
            @click="mode = item"
          >
            {{ labels[item] }}
          </button>
        </div>
      </div>
    </div>

    <div class="grid min-h-0 flex-1" :class="mode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'">
      <div
        v-if="mode !== 'preview'"
        class="relative min-h-[14rem] border-input bg-background lg:min-h-0"
        :class="mode === 'split' ? 'border-b lg:border-r lg:border-b-0' : ''"
      >
        <!-- eslint-disable vue/no-v-html -->
        <pre
          ref="overlayRef"
          class="ag-json-source pointer-events-none absolute inset-0 m-0 overflow-auto px-4 py-3 font-mono text-sm leading-6 whitespace-pre-wrap break-words text-foreground"
          aria-hidden="true"
          v-html="highlightedSource"
        />
        <!-- eslint-enable vue/no-v-html -->
        <textarea
          ref="textareaRef"
          :value="modelValue"
          class="ag-json-input absolute inset-0 z-10 m-0 h-full w-full resize-none px-4 py-3 font-mono text-sm leading-6 outline-none"
          spellcheck="false"
          :aria-label="label"
          :aria-invalid="Boolean(errorText)"
          @input="onInput"
          @scroll="syncScroll"
        />
      </div>
      <div
        v-if="mode !== 'write'"
        class="min-h-[14rem] overflow-auto bg-background px-4 py-3 lg:min-h-0"
      >
        <JsonViewer v-if="parsed.ok" :value="parsed.value" :empty-text="emptyText" />
        <p v-else class="text-sm text-destructive">{{ errorText }}</p>
      </div>
    </div>
    <p
      v-if="errorText && mode === 'write'"
      class="border-t border-input/80 px-4 py-2 text-xs text-destructive"
    >
      {{ errorText }}
    </p>
  </div>
</template>
