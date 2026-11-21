<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import ChartRenderer, { type SupportedChartType } from '../components/charts/ChartRenderer.vue';
import type { ChartPoint } from '../components/charts/chartTypes';
import { useTheme } from '../composables/useTheme';

type ChartType = SupportedChartType;

const { t } = useI18n();
const { theme: appTheme } = useTheme();
const chartEl = ref<HTMLElement | null>(null);
const chartType = ref<ChartType>('line');
const title = ref('Weekly performance');
const xAxisTitle = ref('Day');
const xAxisDescription = ref('Daily reporting period');
const yAxisTitle = ref('Revenue');
const yAxisDescription = ref('Amount in USD');
const fontSize = ref<'sm' | 'md' | 'lg'>('md');
const horizontal = ref(false);
const strokeWidth = ref(4);
const opacity = ref(100);
const cornerRadius = ref(12);
const chartBackground = ref(appTheme.value === 'dark' ? '#1f2937' : '#ffffff');
const titleColor = ref(appTheme.value === 'dark' ? '#f9fafb' : '#111827');
const titleAlign = ref<'left' | 'center' | 'right'>('center');
const chartTheme = ref<'light' | 'dark'>(appTheme.value === 'dark' ? 'dark' : 'light');
const showLegend = ref(true);
const showConfig = ref(false);
const showData = ref(false);
const showMoreActions = ref(false);
const displayMode = ref<'overview' | 'standard' | 'detail'>('standard');
const padding = ref(16);
const dimensionColumn = ref('label');
const valueColumn = ref<'value' | 'cost' | 'users'>('value');
const compareColumn = ref<'cost' | 'users'>('cost');
const palette = ref<'indigo' | 'emerald' | 'rose'>('indigo');
const showGrid = ref(true);
const showLabels = ref(true);
const smooth = ref(true);
const highlighted = ref<number | null>(null);
const selected = ref(0);
const data = ref<ChartPoint[]>([
  { label: 'Mon', value: 38 },
  { label: 'Tue', value: 62 },
  { label: 'Wed', value: 47 },
  { label: 'Thu', value: 78 },
  { label: 'Fri', value: 66 },
  { label: 'Sat', value: 91 },
  { label: 'Sun', value: 73 },
]);
const tableRows = ref([
  { label: 'Mon', value: 38, cost: 24, users: 42 },
  { label: 'Tue', value: 62, cost: 31, users: 57 },
  { label: 'Wed', value: 47, cost: 28, users: 49 },
  { label: 'Thu', value: 78, cost: 41, users: 68 },
  { label: 'Fri', value: 66, cost: 38, users: 61 },
  { label: 'Sat', value: 91, cost: 55, users: 83 },
  { label: 'Sun', value: 73, cost: 45, users: 72 },
]);
const chartData = computed<ChartPoint[]>(() =>
  tableRows.value.map((row) => ({
    label: String(row[dimensionColumn.value as 'label']),
    value: Number(row[valueColumn.value]),
  })),
);
const compareData = computed<ChartPoint[]>(() =>
  tableRows.value.map((row) => ({
    label: String(row[dimensionColumn.value as 'label']),
    value: Number(row[compareColumn.value]),
  })),
);
const chartTypes: ChartType[] = [
  'line',
  'area',
  'bar',
  'stackedBar',
  'donut',
  'pie',
  'scatter',
  'radar',
  'gauge',
  'heatmap',
  'boxplot',
  'wordcloud',
  'waterfall',
  'funnel',
  'treemap',
  'sankey',
  'bubble',
  'polarArea',
  'candlestick',
  'histogram',
];
const usesCartesianAxes = computed(() =>
  [
    'line',
    'area',
    'bar',
    'stackedBar',
    'scatter',
    'boxplot',
    'waterfall',
    'bubble',
    'candlestick',
    'histogram',
  ].includes(chartType.value),
);

const colors = computed(
  () =>
    ({
      indigo: {
        primary: '#6366f1',
        fill: '#c7d2fe',
        muted: '#eef2ff',
        series: ['#6366f1', '#06b6d4', '#22c55e', '#f59e0b', '#ec4899', '#a855f7', '#ef4444'],
      },
      emerald: {
        primary: '#10b981',
        fill: '#a7f3d0',
        muted: '#ecfdf5',
        series: ['#10b981', '#06b6d4', '#84cc16', '#f59e0b', '#8b5cf6', '#f43f5e', '#14b8a6'],
      },
      rose: {
        primary: '#f43f5e',
        fill: '#fecdd3',
        muted: '#fff1f2',
        series: ['#f43f5e', '#8b5cf6', '#06b6d4', '#f59e0b', '#22c55e', '#ec4899', '#64748b'],
      },
    })[palette.value],
);
const maxValue = computed(() => Math.max(...data.value.map((point) => point.value), 100));
const total = computed(() => data.value.reduce((sum, point) => sum + point.value, 0));
const average = computed(() => Math.round(total.value / data.value.length));
const chartPoints = computed(() =>
  data.value.map((point, index) => ({
    ...point,
    x: 54 + index * (592 / Math.max(data.value.length - 1, 1)),
    y: 228 - (point.value / maxValue.value) * 174,
  })),
);
const linePath = computed(() => {
  const points = chartPoints.value;
  if (!smooth.value || points.length < 3) {
    return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  }
  return (
