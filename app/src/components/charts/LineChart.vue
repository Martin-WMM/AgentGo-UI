<script setup lang="ts">
import { computed, ref } from 'vue';

import type { ChartColors, ChartPoint } from './chartTypes';

const props = withDefaults(
  defineProps<{
    data: ChartPoint[];
    compareData?: ChartPoint[];
    colors: ChartColors;
    compareColor?: string;
    showGrid?: boolean;
    showLabels?: boolean;
    smooth?: boolean;
    strokeWidth?: number;
    selectedIndex?: number | null;
    compact?: boolean;
  }>(),
  {
    compareData: () => [],
    compareColor: '#f59e0b',
    showGrid: true,
    showLabels: true,
    smooth: true,
    strokeWidth: 4,
    selectedIndex: null,
    compact: false,
  },
);
const emit = defineEmits<{ select: [index: number] }>();
const hoveredIndex = ref<number | null>(null);
const width = computed(() => (props.compact ? 240 : 700));
const height = computed(() => (props.compact ? 116 : 290));
const left = computed(() => (props.compact ? 12 : 54));
const bottom = computed(() => (props.compact ? 98 : 228));
const right = computed(() => (props.compact ? 228 : 646));
const max = computed(() =>
  Math.max(
    ...props.data.map((point) => point.value),
    ...props.compareData.map((point) => point.value),
    100,
  ),
);
const tickValues = computed(() =>
  [0, 1, 2, 3, 4].map((step) => Math.round(max.value - (step * max.value) / 4)),
);
const points = computed(() =>
  props.data.map((point, index) => ({
    ...point,
    x: left.value + index * ((right.value - left.value) / Math.max(props.data.length - 1, 1)),
    y: bottom.value - (point.value / max.value) * (props.compact ? 78 : 174),
  })),
);
const comparePoints = computed(() =>
  props.compareData.map((point, index) => ({
    ...point,
    x:
      left.value + index * ((right.value - left.value) / Math.max(props.compareData.length - 1, 1)),
    y: bottom.value - (point.value / max.value) * (props.compact ? 78 : 174),
  })),
);
const path = computed(() => {
  const items = points.value;
  if (!props.smooth || items.length < 3)
    return items.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  return (
    items.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const previous = items[index - 1];
      return `${path} Q ${previous.x} ${previous.y} ${(previous.x + point.x) / 2} ${(previous.y + point.y) / 2}`;
    }, '') + ` T ${items.at(-1)?.x} ${items.at(-1)?.y}`
  );
});
const comparePath = computed(() =>
  comparePoints.value.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' '),
);
</script>
<template>
  <svg :viewBox="`0 0 ${width} ${height}`" class="h-auto w-full" role="img">
    <g v-if="showGrid" stroke="currentColor" class="text-border" stroke-dasharray="4 5">
      <line
        v-for="step in 4"
        :key="step"
        :x1="left"
        :y1="18 + step * ((bottom - 18) / 4)"
        :x2="right"
        :y2="18 + step * ((bottom - 18) / 4)"
      />
    </g>
    <g v-if="showLabels && !compact" class="fill-muted-foreground text-[12px]">
      <text
        v-for="(tick, index) in tickValues"
        :key="tick"
        :x="left - 10"
        :y="22 + index * ((bottom - 18) / 4)"
        text-anchor="end"
      >
        {{ tick }}
      </text>
    </g>
    <path
      v-if="comparePoints.length"
      :d="comparePath"
      fill="none"
      :stroke="compareColor"
      :stroke-width="compact ? Math.max(2, strokeWidth - 1) : strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-dasharray="7 5"
    />
    <path
      :d="path"
      fill="none"
      :stroke="colors.primary"
      :stroke-width="compact ? Math.max(2, strokeWidth - 1) : strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <g v-for="(point, index) in points" :key="point.label">
      <circle
        :cx="point.x"
        :cy="point.y"
        :r="hoveredIndex === index || selectedIndex === index ? 8 : compact ? 3 : 5"
        :fill="colors.primary"
        class="cursor-pointer stroke-card transition-all"
        stroke-width="3"
        @mouseenter="hoveredIndex = index"
        @mouseleave="hoveredIndex = null"
        @click="emit('select', index)"
      />
      <text
        v-if="showLabels && !compact"
        :x="point.x"
        :y="bottom + 30"
        text-anchor="middle"
        class="fill-muted-foreground text-[12px]"
      >
        {{ point.label }}
      </text>
      <g v-if="hoveredIndex === index && !compact" pointer-events="none">
        <rect
          :x="point.x - 42"
          :y="point.y - 48"
          width="84"
          height="35"
          rx="6"
          class="fill-foreground"
        />
        <text
          :x="point.x"
          :y="point.y - 31"
          text-anchor="middle"
          class="fill-background text-[12px]"
        >
          {{ point.label }}: {{ point.value }}
        </text>
      </g>
    </g>
  </svg>
</template>
