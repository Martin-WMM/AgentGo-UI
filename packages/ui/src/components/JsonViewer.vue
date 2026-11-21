<script setup lang="ts">
import { computed } from 'vue';

import { highlightJson, stringifyJson } from '../lib/markup';

const props = withDefaults(
  defineProps<{
    /** Parsed value, or a JSON string that is highlighted as written. */
    value?: unknown;
    source?: string | null;
    emptyText?: string;
  }>(),
  { value: undefined, source: null, emptyText: 'Nothing to preview yet.' },
);

const text = computed(() => {
  if (props.source !== null) return props.source;
  if (props.value === undefined) return '';
  return stringifyJson(props.value);
});
const html = computed(() => (text.value.trim() ? highlightJson(text.value) : ''));
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <pre
    v-if="html"
    class="ag-json-view overflow-auto font-mono text-sm leading-6 whitespace-pre-wrap break-words"
  ><code class="hljs language-json" v-html="html" /></pre>
  <!-- eslint-enable vue/no-v-html -->
  <p v-else class="text-sm text-muted-foreground">{{ emptyText }}</p>
</template>
