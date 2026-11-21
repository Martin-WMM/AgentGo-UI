<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useI18n } from 'vue-i18n';

defineProps<{
  count: number;
  total: number;
  allSelected: boolean;
  deleting: boolean;
}>();

const emit = defineEmits<{
  toggleAll: [];
  remove: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div
    v-if="total > 0"
    class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-input bg-card px-4 py-3"
  >
    <label class="flex items-center gap-2 text-sm font-medium">
      <input
        type="checkbox"
        class="size-4 rounded border-input accent-primary"
        :checked="allSelected"
        :disabled="deleting"
        :aria-label="t('selection.selectAll')"
        @change="emit('toggleAll')"
      />
      {{ t('selection.selected', { count }) }}
    </label>
    <button
      type="button"
      class="ag-btn ag-btn-danger"
      :disabled="count === 0 || deleting"
      @click="emit('remove')"
    >
      <Icon icon="lucide:trash-2" width="16" height="16" aria-hidden="true" />
      {{ t('selection.deleteSelected') }}
    </button>
  </div>
</template>
