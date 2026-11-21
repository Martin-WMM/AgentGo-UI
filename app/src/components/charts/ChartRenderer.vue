<script setup lang="ts">
import { computed } from 'vue';

import AreaChart from './AreaChart.vue';
import BarChart from './BarChart.vue';
import DonutChart from './DonutChart.vue';
import LineChart from './LineChart.vue';
import type { ChartColors, ChartPoint } from './chartTypes';

export type SupportedChartType =
  | 'line'
  | 'area'
  | 'bar'
  | 'stackedBar'
  | 'donut'
  | 'pie'
  | 'scatter'
  | 'radar'
  | 'gauge'
  | 'heatmap'
  | 'boxplot'
  | 'wordcloud'
  | 'waterfall'
  | 'funnel'
  | 'treemap'
  | 'sankey'
  | 'bubble'
  | 'polarArea'
  | 'candlestick'
  | 'histogram';
const props = withDefaults(
  defineProps<{
    type: SupportedChartType;
    data: ChartPoint[];
    compareData?: ChartPoint[];
    colors: ChartColors;
    showGrid?: boolean;
    showLabels?: boolean;
    smooth?: boolean;
    strokeWidth?: number;
    cornerRadius?: number;
    horizontal?: boolean;
    selectedIndex?: number | null;
    compact?: boolean;
  }>(),
  {
    compareData: () => [],
    showGrid: true,
    showLabels: true,
    smooth: true,
    strokeWidth: 4,
    cornerRadius: 7,
    horizontal: false,
    selectedIndex: null,
    compact: false,
  },
);
const emit = defineEmits<{ select: [index: number] }>();
const total = computed(() => props.data.reduce((sum, point) => sum + point.value, 0));
const max = computed(() => Math.max(...props.data.map((point) => point.value), 100));
const hasYAxis = computed(() =>
  ['scatter', 'boxplot', 'waterfall', 'bubble', 'candlestick', 'histogram', 'stackedBar'].includes(
    props.type,
  ),
);
const tickValues = computed(() =>
  [0, 1, 2, 3, 4].map((step) => Math.round(max.value - (step * max.value) / 4)),
);
const colorAt = (index: number) =>
  props.colors.series?.[index % props.colors.series.length] ?? props.colors.primary;
const points = computed(() =>
  props.data.map((point, index) => ({
    ...point,
    x: 42 + index * (616 / Math.max(props.data.length - 1, 1)),
    y: 230 - (point.value / max.value) * 178,
  })),
);
const pieSegments = computed(() => {
  let offset = 0;
  return props.data.map((point, index) => {
    const dash = (point.value / total.value) * 100;
    const segment = { ...point, index, dash, offset };
    offset += dash;
    return segment;
  });
});
</script>

<template>
  <LineChart
    v-if="type === 'line'"
    :data="data"
    :compare-data="compareData"
    :colors="colors"
    :show-grid="showGrid"
    :show-labels="showLabels"
    :smooth="smooth"
    :stroke-width="strokeWidth"
    :selected-index="selectedIndex"
    :compact="compact"
    @select="emit('select', $event)"
  />
  <AreaChart
    v-else-if="type === 'area'"
    :data="data"
    :compare-data="compareData"
    :colors="colors"
    :show-grid="showGrid"
    :show-labels="showLabels"
    :smooth="smooth"
    :stroke-width="strokeWidth"
    :selected-index="selectedIndex"
    :compact="compact"
    @select="emit('select', $event)"
  />
  <BarChart
    v-else-if="type === 'bar'"
    :data="data"
    :compare-data="compareData"
    :colors="colors"
    :show-grid="showGrid"
    :show-labels="showLabels"
    :corner-radius="cornerRadius"
    :selected-index="selectedIndex"
    :compact="compact"
    @select="emit('select', $event)"
  />
  <DonutChart
    v-else-if="type === 'donut'"
    :data="data"
    :colors="colors"
    :show-labels="showLabels"
    :selected-index="selectedIndex"
    :compact="compact"
    @select="emit('select', $event)"
  />
  <svg v-else viewBox="0 0 700 290" class="h-auto w-full" role="img">
    <g v-if="hasYAxis && showLabels" class="fill-muted-foreground text-[12px]">
      <line x1="42" y1="25" x2="42" y2="230" class="stroke-border" />
      <text
        v-for="(tick, index) in tickValues"
        :key="tick"
        x="32"
        :y="29 + index * (205 / 4)"
        text-anchor="end"
      >
        {{ tick }}
      </text>
    </g>
    <g v-if="type === 'pie'" transform="translate(350 145) rotate(-90)">
