<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed } from 'vue';

import { isResourceIcon, type ResourceIconValue } from '../lib/resourceIcon';

const props = withDefaults(
  defineProps<{
    icon?: ResourceIconValue | null;
    size?: number;
  }>(),
  { icon: null, size: 18 },
);

const usable = computed(() => (isResourceIcon(props.icon) ? props.icon : null));
</script>

<template>
  <Icon
    v-if="usable?.source === 'ICONIFY'"
    :icon="usable.value"
    :width="size"
    :height="size"
    aria-hidden="true"
  />
  <img
    v-else-if="usable?.source === 'URL'"
    :src="usable.value"
    alt=""
    class="inline-block object-contain"
    :style="{ width: `${size}px`, height: `${size}px` }"
  />
</template>
