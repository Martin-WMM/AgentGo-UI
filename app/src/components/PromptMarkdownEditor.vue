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

.prompt-md-preview :deep(p),
.prompt-md-preview :deep(ul),
.prompt-md-preview :deep(ol) {
  margin: 0.65em 0;
}

.prompt-md-preview :deep(.hljs) {
  background: transparent;
  color: inherit;
}
</style>
