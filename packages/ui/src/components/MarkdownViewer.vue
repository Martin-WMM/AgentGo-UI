<script setup lang="ts">
import { computed } from 'vue';

import { renderMarkdown } from '../lib/markup';

const props = withDefaults(
  defineProps<{
    source?: string;
    emptyText?: string;
  }>(),
  { source: '', emptyText: 'Nothing to preview yet.' },
);

const html = computed(() => renderMarkdown(props.source));
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div v-if="html" class="ag-md-preview max-w-none text-sm leading-relaxed" v-html="html" />
  <p v-else class="text-sm text-muted-foreground">{{ emptyText }}</p>
</template>
