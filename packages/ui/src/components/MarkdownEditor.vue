<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed, nextTick, ref, watch } from 'vue';

import { escapeHtml, highlightMarkdownSource } from '../lib/markup';
import MarkdownViewer from './MarkdownViewer.vue';

type EditorMode = 'split' | 'write' | 'preview';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    placeholder?: string;
    emptyText?: string;
    modesLabel?: string;
    modeLabels?: Partial<Record<EditorMode, string>>;
    highlightPlaceholders?: boolean;
  }>(),
  {
    label: 'Content',
    placeholder: '',
    emptyText: 'Nothing to preview yet.',
    modesLabel: 'Editor layout',
    modeLabels: () => ({}),
    highlightPlaceholders: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const mode = ref<EditorMode>('split');
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const overlayRef = ref<HTMLPreElement | null>(null);
const modes: EditorMode[] = ['split', 'write', 'preview'];

const labels = computed(() => ({
  split: props.modeLabels.split ?? 'Split',
  write: props.modeLabels.write ?? 'Write',
  preview: props.modeLabels.preview ?? 'Preview',
}));
const highlightedSource = computed(() => {
  if (!props.modelValue) {
    return `<span class="ag-placeholder">${escapeHtml(props.placeholder)}</span>`;
  }
  return highlightMarkdownSource(props.modelValue, props.highlightPlaceholders);
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
</script>

<template>
  <div class="flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-input bg-card">
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-input/80 bg-accent/30 px-4 py-2.5"
    >
      <div class="flex items-center gap-2 text-sm font-medium">
        <Icon
          icon="lucide:file-text"
          width="16"
          height="16"
          class="text-primary"
          aria-hidden="true"
        />
        {{ label }}
      </div>
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

    <div class="grid min-h-0 flex-1" :class="mode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'">
      <div
        v-if="mode !== 'preview'"
        class="relative min-h-[22rem] border-input lg:min-h-0"
        :class="mode === 'split' ? 'border-b lg:border-r lg:border-b-0' : ''"
      >
        <!-- eslint-disable vue/no-v-html -->
        <pre
          ref="overlayRef"
          class="ag-md-source pointer-events-none absolute inset-0 overflow-auto px-4 py-4 font-mono text-sm leading-6 whitespace-pre-wrap break-words text-foreground"
          aria-hidden="true"
          v-html="highlightedSource"
        />
        <!-- eslint-enable vue/no-v-html -->
        <textarea
          ref="textareaRef"
          :value="modelValue"
          class="absolute inset-0 z-10 h-full w-full resize-none bg-transparent px-4 py-4 font-mono text-sm leading-6 text-transparent caret-foreground outline-none selection:bg-primary/25"
          spellcheck="false"
          :aria-label="label"
          @input="onInput"
          @scroll="syncScroll"
        />
      </div>
      <div
        v-if="mode !== 'write'"
        class="min-h-[22rem] overflow-auto bg-background/60 px-5 py-4 lg:min-h-0"
      >
        <MarkdownViewer :source="modelValue" :empty-text="emptyText" />
      </div>
    </div>
  </div>
</template>
