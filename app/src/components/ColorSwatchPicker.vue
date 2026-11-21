<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { workspaceColors } from '../lib/workspaceColors';

const props = defineProps<{
  modelValue: string;
  legend: string;
  name?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [color: string];
}>();

const { t } = useI18n();
const selected = computed(
  () =>
    workspaceColors.find(
      (swatch) => swatch.value.toUpperCase() === props.modelValue.toUpperCase(),
    ) ?? workspaceColors[0],
);
</script>

<template>
  <fieldset>
    <legend class="text-sm font-medium">{{ legend }}</legend>
    <div class="mt-3 flex flex-wrap gap-2.5" role="radiogroup" :aria-label="legend">
      <label
        v-for="swatch in workspaceColors"
        :key="swatch.id"
        class="ag-swatch relative cursor-pointer"
      >
        <input
          class="peer sr-only"
          type="radio"
          :name="name || 'accent-color'"
          :value="swatch.value"
          :checked="swatch.value.toUpperCase() === modelValue.toUpperCase()"
          @change="emit('update:modelValue', swatch.value)"
        />
        <span
          class="ag-swatch-dot peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring"
          :data-selected="swatch.value.toUpperCase() === modelValue.toUpperCase()"
          :style="{ backgroundColor: swatch.value, '--swatch': swatch.value }"
        >
          <Icon
            v-if="swatch.value.toUpperCase() === modelValue.toUpperCase()"
            icon="lucide:check"
            width="16"
            height="16"
            aria-hidden="true"
          />
        </span>
        <span class="sr-only">{{ t(swatch.labelKey) }}</span>
      </label>
    </div>
    <p class="mt-2 text-xs text-muted-foreground">{{ t(selected.labelKey) }}</p>
  </fieldset>
</template>
