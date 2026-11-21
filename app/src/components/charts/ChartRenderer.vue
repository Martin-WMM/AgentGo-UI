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
      <circle r="92" fill="none" stroke="currentColor" stroke-width="184" class="text-muted" />
      <circle
        v-for="segment in pieSegments"
        :key="segment.label"
        r="92"
        fill="none"
        :stroke="colorAt(segment.index)"
        stroke-width="184"
        pathLength="100"
        :stroke-dasharray="`${segment.dash - 1} ${101 - segment.dash}`"
        :stroke-dashoffset="-segment.offset"
        class="cursor-pointer"
        @click="emit('select', segment.index)"
      />
    </g>
    <g v-else-if="type === 'gauge'" transform="translate(350 235) rotate(180)">
      <circle
        r="105"
        fill="none"
        stroke="currentColor"
        stroke-width="30"
        stroke-dasharray="330 660"
        class="text-muted"
      />
      <circle
        r="105"
        fill="none"
        :stroke="colors.primary"
        stroke-width="30"
        stroke-linecap="round"
        stroke-dasharray="330 660"
        :stroke-dashoffset="330 - ((data[0]?.value ?? 0) / 100) * 330"
      />
    </g>
    <g v-if="type === 'pie' && showLabels" class="fill-muted-foreground text-[12px]">
      <g v-for="(segment, index) in pieSegments" :key="`legend-${segment.label}`">
        <circle
          :cx="520 + (index % 2) * 90"
          :cy="254 + Math.floor(index / 2) * 18"
          r="4"
          :fill="colorAt(index)"
        />
        <text :x="528 + (index % 2) * 90" :y="258 + Math.floor(index / 2) * 18">
          {{ segment.label }} {{ segment.value }}
        </text>
      </g>
    </g>
    <g v-else-if="type === 'radar'" transform="translate(350 145)">
      <polygon
        points="0,-105 100,-35 62,85 -62,85 -100,-35"
        fill="none"
        class="stroke-border"
        stroke-width="2"
      />
      <polygon
        :points="
          data
            .slice(0, 5)
            .map((point, index) => {
              const a = -Math.PI / 2 + (index * Math.PI * 2) / 5;
              const r = (point.value / max) * 105;
              return `${Math.cos(a) * r},${Math.sin(a) * r}`;
            })
            .join(' ')
        "
        :fill="colors.fill"
        :stroke="colors.primary"
        stroke-width="3"
      />
      <text
        v-for="(point, index) in data.slice(0, 5)"
        :key="`axis-${point.label}`"
        :x="Math.cos(-Math.PI / 2 + (index * Math.PI * 2) / 5) * 125"
        :y="Math.sin(-Math.PI / 2 + (index * Math.PI * 2) / 5) * 125 + 4"
        text-anchor="middle"
        class="fill-muted-foreground text-[12px]"
      >
        {{ point.label }}
      </text>
    </g>
    <g v-else-if="type === 'scatter'">
      <g v-if="showGrid" stroke="currentColor" class="text-border" stroke-dasharray="4 5">
        <line
          v-for="step in 4"
          :key="step"
          x1="42"
          :y1="25 + step * 45"
          x2="658"
          :y2="25 + step * 45"
        />
      </g>
      <circle
        v-for="(point, index) in points"
        :key="point.label"
        :cx="point.x"
        :cy="point.y"
        :r="selectedIndex === index ? 11 : 7"
        :fill="colorAt(index)"
        class="cursor-pointer"
        @click="emit('select', index)"
      />
    </g>
    <g v-else-if="type === 'heatmap'" transform="translate(95 35)">
      <g v-for="(point, index) in data" :key="point.label">
        <rect
          v-for="column in 5"
          :key="column"
          :x="(index % 4) * 125"
          :y="Math.floor(index / 4) * 95"
          width="112"
          height="82"
          rx="10"
          :fill="colorAt(index)"
          :opacity="0.15 + ((point.value + column * 9) % 100) / 120"
          class="cursor-pointer"
          @click="emit('select', index)"
        />
        <text
          :x="(index % 4) * 125 + 56"
          :y="Math.floor(index / 4) * 95 + 48"
          text-anchor="middle"
          class="fill-foreground text-[11px] font-medium"
        >
          {{ point.value }}
        </text>
      </g>
    </g>
    <g v-else-if="type === 'boxplot'" transform="translate(80 20)">
      <g
        v-for="(point, index) in data.slice(0, 6)"
        :key="point.label"
        :transform="`translate(${index * 95} 0)`"
      >
        <line
          x1="40"
          :y1="205 - point.value"
          x2="40"
          :y2="235 - point.value"
          :stroke="colors.primary"
          stroke-width="3"
        />
        <rect
          x="18"
          :y="185 - point.value"
          width="44"
          height="40"
          :fill="colors.fill"
          :stroke="colors.primary"
          stroke-width="3"
        />
