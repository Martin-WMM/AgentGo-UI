<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  ttftMs?: number | null;
  liked?: boolean | null;
  speaking?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  copy: [];
  speak: [];
  refresh: [];
  like: [];
  dislike: [];
}>();

const { t } = useI18n();

const latencyLabel = computed(() => {
  const ms = props.ttftMs;
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '';
  if (ms < 1000) return t('chat.latencyMs', { value: Math.round(ms) });
  return t('chat.latencySec', { value: (ms / 1000).toFixed(ms < 10_000 ? 1 : 0) });
});
</script>

<template>
  <div class="flex flex-wrap items-center gap-1 pt-1">
    <button
      type="button"
      class="ag-btn ag-btn-ghost ag-btn-icon size-8 text-muted-foreground"
      :aria-label="t('chat.actions.copy')"
      :title="t('chat.actions.copy')"
      :disabled="disabled"
      @click="emit('copy')"
    >
      <Icon icon="lucide:copy" width="15" height="15" aria-hidden="true" />
    </button>
    <button
      type="button"
      class="ag-btn ag-btn-ghost ag-btn-icon size-8 text-muted-foreground"
      :aria-label="speaking ? t('chat.actions.stopSpeak') : t('chat.actions.speak')"
      :title="speaking ? t('chat.actions.stopSpeak') : t('chat.actions.speak')"
      :disabled="disabled"
      @click="emit('speak')"
    >
      <Icon
        :icon="speaking ? 'lucide:volume-x' : 'lucide:volume-2'"
        width="15"
        height="15"
        aria-hidden="true"
      />
    </button>
    <button
      type="button"
      class="ag-btn ag-btn-ghost ag-btn-icon size-8 text-muted-foreground"
      :aria-label="t('chat.actions.refresh')"
      :title="t('chat.actions.refresh')"
      :disabled="disabled"
      @click="emit('refresh')"
    >
      <Icon icon="lucide:refresh-cw" width="15" height="15" aria-hidden="true" />
    </button>
    <button
      type="button"
      class="ag-btn ag-btn-ghost ag-btn-icon size-8"
      :class="liked === true ? 'text-primary' : 'text-muted-foreground'"
      :aria-label="t('chat.actions.like')"
      :title="t('chat.actions.like')"
      :aria-pressed="liked === true"
      :disabled="disabled"
      @click="emit('like')"
    >
      <Icon
        :icon="liked === true ? 'lucide:thumbs-up' : 'lucide:thumbs-up'"
        width="15"
        height="15"
        aria-hidden="true"
      />
    </button>
    <button
      type="button"
      class="ag-btn ag-btn-ghost ag-btn-icon size-8"
      :class="liked === false ? 'text-destructive' : 'text-muted-foreground'"
      :aria-label="t('chat.actions.dislike')"
      :title="t('chat.actions.dislike')"
      :aria-pressed="liked === false"
      :disabled="disabled"
      @click="emit('dislike')"
    >
      <Icon icon="lucide:thumbs-down" width="15" height="15" aria-hidden="true" />
    </button>
    <span
      v-if="latencyLabel"
      class="ml-auto inline-flex items-center gap-1 px-1 text-xs text-muted-foreground"
      :title="t('chat.latencyHint')"
    >
      <Icon icon="lucide:timer" width="13" height="13" aria-hidden="true" />
      {{ latencyLabel }}
    </span>
  </div>
</template>
