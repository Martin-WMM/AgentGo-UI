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
    cornerRadius?: number;
    selectedIndex?: number | null;
    compact?: boolean;
  }>(),
  {
    compareData: () => [],
    compareColor: '#f59e0b',
    showGrid: true,
    showLabels: true,
    cornerRadius: 7,
    selectedIndex: null,
    compact: false,
  },
);
const emit = defineEmits<{ select: [index: number] }>();
const hovered = ref<{ index: number; series: 'primary' | 'compare' } | null>(null);
const width = computed(() => (props.compact ? 240 : 700));
const height = computed(() => (props.compact ? 116 : 290));
const left = computed(() => (props.compact ? 12 : 54));
const bottom = computed(() => (props.compact ? 98 : 228));
const right = computed(() => (props.compact ? 228 : 646));
const top = computed(() => (props.compact ? 10 : 18));
const hasComparison = computed(() => props.compareData.length > 0);
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
const bars = computed(() =>
  props.data.map((point, index) => {
    const space = (right.value - left.value) / props.data.length;
    const count = hasComparison.value ? 2 : 1;
    const gap = props.compact ? 2 : 6;
    const barWidth = Math.min(props.compact ? 18 : 44, (space * 0.74 - gap * (count - 1)) / count);
    const groupWidth = barWidth * count + gap * (count - 1);
    const x = left.value + index * space + (space - groupWidth) / 2;
    const plotHeight = bottom.value - top.value;
    const primaryHeight = (point.value / max.value) * plotHeight;
    const compareValue = props.compareData[index]?.value;
    const compareHeight = compareValue === undefined ? 0 : (compareValue / max.value) * plotHeight;
    return {
      label: point.label,
      index,
      primary: { x, value: point.value, y: bottom.value - primaryHeight, height: primaryHeight },
      compare: {
        x: x + barWidth + gap,
        value: compareValue,
        y: bottom.value - compareHeight,
        height: compareHeight,
      },
      width: barWidth,
      center: left.value + index * space + space / 2,
    };
  }),
);
</script>

<template>
  <svg :viewBox="`0 0 ${width} ${height}`" class="h-auto w-full" role="img">
    <g v-if="showGrid" stroke="currentColor" class="text-border" stroke-dasharray="4 5">
      <line
        v-for="step in 4"
        :key="step"
        :x1="left"
        :y1="top + step * ((bottom - top) / 4)"
        :x2="right"
        :y2="top + step * ((bottom - top) / 4)"
      />
    </g>
    <g v-if="showLabels && !compact" class="fill-muted-foreground text-[12px]">
      <text
        v-for="(tick, index) in tickValues"
        :key="tick"
        :x="left - 10"
        :y="top + 4 + index * ((bottom - top) / 4)"
        text-anchor="end"
      >
        {{ tick }}
      </text>
    </g>
    <g v-for="bar in bars" :key="bar.label">
      <rect
        :x="bar.primary.x"
        :y="bar.primary.y"
        :width="bar.width"
        :height="bar.primary.height"
        :rx="cornerRadius"
        :fill="colors.primary"
        :opacity="selectedIndex === null || selectedIndex === bar.index ? 1 : 0.35"
        class="cursor-pointer"
        @mouseenter="hovered = { index: bar.index, series: 'primary' }"
        @mouseleave="hovered = null"
        @click="emit('select', bar.index)"
      />
      <rect
        v-if="hasComparison && bar.compare.value !== undefined"
        :x="bar.compare.x"
        :y="bar.compare.y"
        :width="bar.width"
        :height="bar.compare.height"
        :rx="cornerRadius"
        :fill="compareColor"
        :opacity="selectedIndex === null || selectedIndex === bar.index ? 0.88 : 0.3"
        class="cursor-pointer"
        @mouseenter="hovered = { index: bar.index, series: 'compare' }"
        @mouseleave="hovered = null"
        @click="emit('select', bar.index)"
      />
      <text
        v-if="showLabels && !compact"
        :x="bar.center"
        :y="bottom + 30"
        text-anchor="middle"
        class="fill-muted-foreground text-[12px]"
      >
        {{ bar.label }}
      </text>
    </g>
    <g v-if="hovered && !compact" pointer-events="none">
      <rect
        :x="Math.min(right - 118, Math.max(left, bars[hovered.index].center - 55))"
        y="18"
        width="118"
        height="38"
        rx="6"
        class="fill-popover stroke-border"
        stroke-width="1"
      />
      <text
        :x="Math.min(right - 59, Math.max(left + 59, bars[hovered.index].center + 4))"
        y="42"
        text-anchor="middle"
        class="fill-popover-foreground text-[12px] font-medium"
      >
        {{ bars[hovered.index].label }}:
        {{
          hovered.series === 'primary'
            ? bars[hovered.index].primary.value
            : bars[hovered.index].compare.value
        }}
      </text>
    </g>
  </svg>
</template>
