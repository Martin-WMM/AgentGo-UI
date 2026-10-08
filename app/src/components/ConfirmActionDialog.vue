<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { Dialog } from '@agentgo/ui';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
  confirm: [];
}>();

const { t } = useI18n();
const dialogOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});
</script>

<template>
  <Dialog :open="dialogOpen" :close-on-overlay="false" @update:open="dialogOpen = $event">
    <div class="flex items-start gap-4">
      <div
        class="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive"
      >
        <Icon icon="lucide:trash-2" width="21" height="21" aria-hidden="true" />
      </div>
      <div>
        <h2 class="text-xl font-semibold">{{ title }}</h2>
        <p class="mt-2 text-sm text-muted-foreground">{{ description }}</p>
      </div>
    </div>
    <p
      class="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
    >
      {{ t('files.deleteWarning') }}
    </p>
    <div class="mt-6 flex justify-end gap-3">
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm hover:bg-accent"
        @click="dialogOpen = false"
      >
        {{ t('files.cancel') }}
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
        @click="emit('confirm')"
      >
        <Icon icon="lucide:trash-2" width="16" height="16" aria-hidden="true" />{{ confirmLabel }}
      </button>
    </div>
  </Dialog>
</template>
