<script setup lang="ts">
import { computed } from 'vue';
import LineChart from './LineChart.vue';
import type { ChartColors, ChartPoint } from './chartTypes';
const props = withDefaults(
  defineProps<{
    data: ChartPoint[];
    compareData?: ChartPoint[];
    colors: ChartColors;
    showGrid?: boolean;
    showLabels?: boolean;
    smooth?: boolean;
    strokeWidth?: number;
    selectedIndex?: number | null;
    compact?: boolean;
  }>(),
  {
    compareData: () => [],
    showGrid: true,
    showLabels: true,
    smooth: true,
    strokeWidth: 4,
    selectedIndex: null,
    compact: false,
  },
);
const emit = defineEmits<{ select: [index: number] }>();
const area = computed(() => {
  const left = props.compact ? 12 : 54;
  const right = props.compact ? 228 : 646;
  const bottom = props.compact ? 98 : 228;
  const max = Math.max(...props.data.map((point) => point.value), 100);
  const points = props.data.map(
    (point, index) =>
      `${left + index * ((right - left) / Math.max(props.data.length - 1, 1))},${bottom - (point.value / max) * (props.compact ? 78 : 174)}`,
  );
  return `M ${points.join(' L ')} L ${right},${bottom} L ${left},${bottom} Z`;
});
</script>
<template>
  <div class="relative">
    <svg
      class="absolute inset-0 h-full w-full"
      :viewBox="`0 0 ${compact ? 240 : 700} ${compact ? 116 : 290}`"
      aria-hidden="true"
    >
      <path :d="area" :fill="colors.fill" opacity=".7" /></svg
    ><LineChart v-bind="props" @select="emit('select', $event)" />
  </div>
</template>
