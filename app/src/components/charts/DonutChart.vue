<script setup lang="ts">
import { computed, ref } from 'vue';

import type { ChartColors, ChartPoint } from './chartTypes';

const props = withDefaults(
  defineProps<{
    data: ChartPoint[];
    colors: ChartColors;
    showLabels?: boolean;
    selectedIndex?: number | null;
    compact?: boolean;
  }>(),
  { showLabels: true, selectedIndex: null, compact: false },
);
const emit = defineEmits<{ select: [index: number] }>();
const hoveredIndex = ref<number | null>(null);
const total = computed(() => props.data.reduce((sum, point) => sum + point.value, 0));
const segments = computed(() => {
  let offset = 0;
  return props.data.map((point, index) => {
    const dash = (point.value / total.value) * 100;
    const result = { ...point, index, dash, offset };
    offset += dash;
    return result;
  });
});
const center = computed(() => (props.compact ? 65 : 245));
const radius = computed(() => (props.compact ? 38 : 91));
const stroke = computed(() => (props.compact ? 18 : 42));
const colorAt = (index: number) =>
  props.colors.series?.[index % props.colors.series.length] ?? props.colors.primary;
</script>

<template>
  <svg
    :viewBox="`0 0 ${compact ? 240 : 700} ${compact ? 116 : 290}`"
    class="h-auto w-full"
    role="img"
  >
    <g :transform="`translate(${center} ${compact ? 58 : 145}) rotate(-90)`">
      <circle
        :r="radius"
        fill="none"
        stroke="currentColor"
        :stroke-width="stroke"
        class="text-muted"
      />
      <circle
        v-for="segment in segments"
        :key="segment.label"
        :r="radius"
        fill="none"
        :stroke="colorAt(segment.index)"
        :stroke-width="hoveredIndex === segment.index ? stroke + 6 : stroke"
        pathLength="100"
        :stroke-dasharray="`${segment.dash - 1} ${101 - segment.dash}`"
        :stroke-dashoffset="-segment.offset"
        :opacity="selectedIndex === null || selectedIndex === segment.index ? 1 : 0.3"
        class="cursor-pointer transition-all"
        @mouseenter="hoveredIndex = segment.index"
        @mouseleave="hoveredIndex = null"
        @click="emit('select', segment.index)"
      />
    </g>
    <text
      :x="compact ? 132 : center"
      :y="compact ? 52 : 138"
      text-anchor="middle"
      class="fill-foreground text-[28px] font-semibold"
    >
      {{ hoveredIndex === null ? total : segments[hoveredIndex].value }}
    </text>
    <text
      :x="compact ? 132 : center"
      :y="compact ? 72 : 164"
      text-anchor="middle"
      class="fill-muted-foreground text-[13px]"
    >
      {{ hoveredIndex === null ? 'Total' : segments[hoveredIndex].label }}
    </text>
    <g v-if="showLabels && !compact" class="fill-muted-foreground text-[13px]">
      <g
        v-for="(segment, index) in segments"
        :key="segment.label"
        class="cursor-pointer"
        @mouseenter="hoveredIndex = index"
        @mouseleave="hoveredIndex = null"
        @click="emit('select', index)"
      >
        <circle cx="442" :cy="59 + index * 28" r="5" :fill="colorAt(index)" />
        <text x="455" :y="63 + index * 28">{{ segment.label }} · {{ segment.value }}</text>
      </g>
    </g>
  </svg>
</template>
