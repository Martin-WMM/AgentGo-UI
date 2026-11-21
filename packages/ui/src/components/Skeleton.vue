<script setup lang="ts">
import { cn } from '../lib/utils';

const props = defineProps<{
  class?: string;
}>();
</script>

<template>
  <span :class="cn('ag-skeleton', props.class)" aria-hidden="true" />
</template>
