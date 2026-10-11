<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { ManagedMcpServer } from '../composables/useMcpServers';
import { mcpPresentation } from '../lib/mcpPresentation';

const props = defineProps<{
  server: ManagedMcpServer;
  index: number;
  deleting: boolean;
  probing: boolean;
}>();

const emit = defineEmits<{
  edit: [];
  remove: [];
  probe: [];
}>();

const { t } = useI18n();
const style = computed(() => mcpPresentation(props.server.status));
const updatedAt = computed(() => new Date(props.server.updatedAt).toLocaleString());
const toolCount = computed(() => props.server.tools.length);
const remoteLabel = computed(() => {
  const name = props.server.remoteServerName;
  const version = props.server.remoteServerVersion;
  if (name && version) return `${name} · ${version}`;
  return name || version || props.server.endpointUrl;
});
</script>

<template>
  <article
    class="group relative flex min-h-56 flex-col overflow-hidden rounded-2xl border bg-background p-5 shadow-sm"
    :style="{
      animationDelay: `${index * 75}ms`,
      borderColor: `color-mix(in srgb, ${style.color} 55%, transparent)`,
      backgroundImage: `linear-gradient(160deg, color-mix(in srgb, ${style.color} 14%, transparent), transparent 42%)`,
