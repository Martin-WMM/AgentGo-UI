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
    points.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const previous = points[index - 1];
      const midpointX = (previous.x + point.x) / 2;
      const midpointY = (previous.y + point.y) / 2;
      return `${path} Q ${previous.x} ${previous.y} ${midpointX} ${midpointY}`;
    }, '') + ` T ${points.at(-1)?.x} ${points.at(-1)?.y}`
  );
});
const areaPath = computed(() => `${linePath.value} L 646 228 L 54 228 Z`);
const donutSegments = computed(() => {
  let offset = 0;
  return data.value.map((point, index) => {
    const portion = point.value / total.value;
    const segment = { ...point, index, dash: portion * 100, offset };
    offset += portion * 100;
    return segment;
  });
});

function setPointValue(index: number, event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  data.value[index] = { ...data.value[index], value: Math.max(0, Math.min(100, value || 0)) };
}

function selectPoint(index: number) {
  selected.value = index;
}

function setChartTheme(theme: 'light' | 'dark') {
  chartTheme.value = theme;
  chartBackground.value = theme === 'dark' ? '#1f2937' : '#ffffff';
  titleColor.value = theme === 'dark' ? '#f9fafb' : '#111827';
}

watch(appTheme, (theme) => setChartTheme(theme === 'dark' ? 'dark' : 'light'));

function csvEscape(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

type DataExportFormat = 'csv' | 'json' | 'excel';
type ImageExportFormat = 'png' | 'jpeg' | 'svg';

function exportData(format: DataExportFormat = 'csv') {
  if (format === 'json') {
    download(
      new Blob([JSON.stringify(tableRows.value, null, 2)], { type: 'application/json' }),
      'agentgo-chart-data.json',
    );
    return;
  }
  if (format === 'excel') {
    const rows = tableRows.value
      .map(
        (row) =>
          `<tr><td>${row.label}</td><td>${row.value}</td><td>${row.cost}</td><td>${row.users}</td></tr>`,
      )
      .join('');
    const workbook = `<html><head><meta charset="utf-8"></head><body><table><thead><tr><th>Day</th><th>Revenue</th><th>Cost</th><th>Users</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    download(
      new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' }),
      'agentgo-chart-data.xls',
    );
    return;
  }
  const csv = [
    'label,value,cost,users',
    ...tableRows.value.map(
      (row) => `${csvEscape(row.label)},${row.value},${row.cost},${row.users}`,
    ),
  ].join('\n');
  download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'agentgo-chart-data.csv');
}

async function exportImage(format: ImageExportFormat = 'png') {
  await nextTick();
  const svg = chartEl.value?.querySelector('svg');
  if (!svg) return;
  const cloned = svg.cloneNode(true) as SVGElement;
  cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const svgData = new XMLSerializer().serializeToString(cloned);
  if (format === 'svg') {
    download(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }), 'agentgo-chart.svg');
    return;
  }
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 720;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = chartBackground.value;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const extension = format === 'jpeg' ? 'jpeg' : 'png';
    canvas.toBlob((blob) => blob && download(blob, `agentgo-chart.${extension}`), mimeType, 0.95);
    URL.revokeObjectURL(image.src);
  };
  image.src = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));
}

function download(blob: Blob, name: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}
</script>

<template>
  <section
    class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10"
    :class="{ dark: chartTheme === 'dark' }"
  >
    <div class="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold text-primary">{{ t('charts.eyebrow') }}</p>
        <h1 class="mt-1 text-3xl font-semibold tracking-tight">{{ t('charts.title') }}</h1>
        <p class="mt-2 max-w-2xl text-base text-muted-foreground">{{ t('charts.description') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div
          class="flex rounded-lg border border-input bg-card p-1"
          :aria-label="t('charts.displayMode')"
        >
          <button
            v-for="mode in ['overview', 'standard', 'detail'] as const"
            :key="mode"
            type="button"
            class="rounded p-2"
            :class="displayMode === mode ? 'bg-accent text-foreground' : 'text-muted-foreground'"
            :aria-label="t(`charts.modes.${mode}`)"
            :title="t(`charts.modes.${mode}`)"
            @click="displayMode = mode"
          >
            <Icon
              :icon="
                mode === 'overview'
                  ? 'lucide:gallery-horizontal-end'
                  : mode === 'standard'
                    ? 'lucide:chart-no-axes-combined'
                    : 'lucide:scan-search'
              "
              width="17"
            />
          </button>
        </div>
        <button
          class="ag-btn ag-btn-outline ag-btn-icon"
          type="button"
          :aria-label="t('charts.exportImage')"
          :title="t('charts.exportImage')"
          @click="exportImage()"
        >
          <Icon icon="lucide:image-down" width="17" />
        </button>
        <button
          class="ag-btn ag-btn-primary ag-btn-icon"
          type="button"
          :aria-label="t('charts.configure')"
          :title="t('charts.configure')"
          @click="showConfig = true"
        >
          <Icon icon="lucide:sliders-horizontal" width="17" />
        </button>
        <div class="relative">
          <button
            class="ag-btn ag-btn-outline ag-btn-icon"
            type="button"
            :aria-label="t('charts.moreActions')"
            :title="t('charts.moreActions')"
            :aria-expanded="showMoreActions"
            @click="showMoreActions = !showMoreActions"
          >
            <Icon icon="lucide:ellipsis" width="18" />
          </button>
          <div
            v-if="showMoreActions"
            class="absolute right-0 z-30 mt-2 flex w-max gap-1 rounded-lg border border-input bg-card p-1 shadow-lg"
          >
            <button
              class="rounded p-2 hover:bg-accent"
              type="button"
              :aria-label="t('charts.viewData')"
              :title="t('charts.viewData')"
              @click="
                showData = true;
                showMoreActions = false;
              "
            >
              <Icon icon="lucide:table-2" width="17" /></button
            ><button
              class="rounded p-2 hover:bg-accent"
              type="button"
              aria-label="Export CSV"
              title="Export CSV"
              @click="
                exportData('csv');
                showMoreActions = false;
              "
            >
              <Icon icon="lucide:file-text" width="17" /></button
            ><button
              class="rounded p-2 hover:bg-accent"
              type="button"
              aria-label="Export JSON"
              title="Export JSON"
              @click="
                exportData('json');
                showMoreActions = false;
              "
            >
              <Icon icon="lucide:braces" width="17" /></button
            ><button
              class="rounded p-2 hover:bg-accent"
              type="button"
              aria-label="Export Excel"
              title="Export Excel"
              @click="
                exportData('excel');
                showMoreActions = false;
              "
            >
              <Icon icon="lucide:sheet" width="17" /></button
            ><button
              class="rounded p-2 hover:bg-accent"
              type="button"
              aria-label="Export PNG"
              title="Export PNG"
              @click="
                exportImage('png');
                showMoreActions = false;
              "
            >
              <Icon icon="lucide:image" width="17" /></button
            ><button
              class="rounded p-2 hover:bg-accent"
              type="button"
              aria-label="Export JPEG"
              title="Export JPEG"
              @click="
                exportImage('jpeg');
                showMoreActions = false;
              "
            >
              <Icon icon="lucide:camera" width="17" /></button
            ><button
              class="rounded p-2 hover:bg-accent"
              type="button"
              aria-label="Export SVG"
              title="Export SVG"
              @click="
                exportImage('svg');
                showMoreActions = false;
              "
            >
              <Icon icon="lucide:vector-square" width="17" /></button
            ><button
              class="rounded p-2 hover:bg-accent"
              type="button"
              :aria-label="t('charts.light')"
              :title="t('charts.light')"
              @click="setChartTheme('light')"
            >
              <Icon icon="lucide:sun" width="17" /></button
            ><button
              class="rounded p-2 hover:bg-accent"
              type="button"
              :aria-label="t('charts.dark')"
              :title="t('charts.dark')"
              @click="setChartTheme('dark')"
            >
              <Icon icon="lucide:moon" width="17" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="block">
      <div
        ref="chartEl"
        class="rounded-2xl border border-input bg-card shadow-sm"
        :class="displayMode === 'overview' ? 'max-w-md p-3' : 'p-4 sm:p-6'"
      >
        <div v-if="false" class="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="font-semibold">{{ t('charts.preview') }}</h2>
            <p class="text-sm text-muted-foreground">{{ t('charts.interactionHint') }}</p>
          </div>
          <div
            class="flex gap-1 rounded-lg bg-muted p-1"
            role="tablist"
            :aria-label="t('charts.type')"
          >
