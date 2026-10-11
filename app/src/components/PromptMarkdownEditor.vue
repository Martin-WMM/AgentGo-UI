<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { escapeHtml, highlightPromptSource, renderPromptMarkdown } from '../lib/promptMarkdown';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

type EditorMode = 'split' | 'write' | 'preview';

const { t } = useI18n();
const mode = ref<EditorMode>('split');
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const overlayRef = ref<HTMLPreElement | null>(null);

const modes: EditorMode[] = ['split', 'write', 'preview'];

const highlightedSource = computed(() => {
  if (!props.modelValue) {
    return `<span class="prompt-placeholder">${escapeHtml(t('prompts.contentPlaceholder'))}</span>`;
  }
  return highlightPromptSource(props.modelValue);
});
const previewHtml = computed(() => renderPromptMarkdown(props.modelValue));

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
        <Icon icon="lucide:file-text" width="16" height="16" class="text-primary" aria-hidden="true" />
        {{ t('prompts.content') }}
      </div>
      <div
        class="inline-flex rounded-xl border border-input bg-background p-0.5"
        role="tablist"
        :aria-label="t('prompts.editorModes')"
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
          {{ t(`prompts.editorMode.${item}`) }}
        </button>
      </div>
    </div>

    <div
      class="grid min-h-0 flex-1"
      :class="mode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'"
    >
      <div
        v-if="mode !== 'preview'"
        class="relative min-h-[22rem] border-input lg:min-h-0"
        :class="mode === 'split' ? 'border-b lg:border-r lg:border-b-0' : ''"
      >
        <pre
          ref="overlayRef"
          class="prompt-source-overlay pointer-events-none absolute inset-0 overflow-auto px-4 py-4 font-mono text-sm leading-6 whitespace-pre-wrap break-words text-foreground"
          aria-hidden="true"
          v-html="highlightedSource"
        />
        <textarea
          ref="textareaRef"
          :value="modelValue"
          class="absolute inset-0 z-10 h-full w-full resize-none bg-transparent px-4 py-4 font-mono text-sm leading-6 text-transparent caret-foreground outline-none selection:bg-primary/25 placeholder:text-muted-foreground/70"
          spellcheck="false"
          :aria-label="t('prompts.content')"
          :placeholder="t('prompts.contentPlaceholder')"
          @input="onInput"
          @scroll="syncScroll"
        />
      </div>

      <div
        v-if="mode !== 'write'"
        class="min-h-[22rem] overflow-auto bg-background/60 px-5 py-4 lg:min-h-0"
      >
        <div
          v-if="previewHtml"
          class="prompt-md-preview max-w-none text-sm leading-relaxed"
          v-html="previewHtml"
        />
        <p v-else class="text-sm text-muted-foreground">{{ t('prompts.markdownPreviewEmpty') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prompt-source-overlay :deep(.prompt-placeholder) {
  color: color-mix(in oklab, var(--color-muted-foreground) 70%, transparent);
}

.prompt-source-overlay :deep(mark.prompt-token) {
  color: var(--color-primary);
  background: color-mix(in oklab, var(--color-primary) 18%, transparent);
  border-radius: 0.25rem;
  box-decoration-break: clone;
}

.prompt-source-overlay :deep(.prompt-md-heading) {
  color: color-mix(in oklab, var(--color-foreground) 88%, var(--color-primary));
  font-weight: 600;
}

.prompt-source-overlay :deep(.prompt-md-inline-code) {
  color: color-mix(in oklab, var(--color-foreground) 70%, #0d9488);
  background: color-mix(in oklab, #0d9488 12%, transparent);
  border-radius: 0.2rem;
}

.prompt-source-overlay :deep(.prompt-md-strong) {
  font-weight: 700;
}

.prompt-md-preview :deep(pre.prompt-md-pre) {
  overflow-x: auto;
  border-radius: 0.75rem;
  border: 1px solid color-mix(in oklab, var(--color-border, currentColor) 40%, transparent);
  background: color-mix(in oklab, var(--color-accent) 55%, transparent);
  padding: 0.85rem 1rem;
  font-size: 0.8125rem;
  line-height: 1.55;
}

.prompt-md-preview :deep(code:not(.hljs)) {
  border-radius: 0.35rem;
  background: color-mix(in oklab, var(--color-accent) 70%, transparent);
  padding: 0.1rem 0.35rem;
  font-size: 0.85em;
}

.prompt-md-preview :deep(h1),
.prompt-md-preview :deep(h2),
.prompt-md-preview :deep(h3) {
  margin-top: 1.1em;
  margin-bottom: 0.45em;
  font-weight: 600;
  letter-spacing: -0.01em;
}
