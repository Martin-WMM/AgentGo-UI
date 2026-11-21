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
            <button
              v-for="type in chartTypes"
              :key="type"
              type="button"
              class="rounded-md px-3 py-1.5 text-sm capitalize transition-colors"
              :class="
                chartType === type
                  ? 'bg-card font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              "
              :aria-selected="chartType === type"
              @click="chartType = type"
            >
              {{ t(`charts.types.${type}`) }}
            </button>
          </div>
        </div>
        <div v-if="false" class="grid gap-4 sm:grid-cols-3">
          <div class="rounded-xl border border-input/70 bg-muted/35 p-4">
            <p class="text-sm text-muted-foreground">{{ t('charts.total') }}</p>
            <p class="mt-1 text-2xl font-semibold">{{ total }}</p>
          </div>
          <div class="rounded-xl border border-input/70 bg-muted/35 p-4">
            <p class="text-sm text-muted-foreground">{{ t('charts.average') }}</p>
            <p class="mt-1 text-2xl font-semibold">{{ average }}</p>
          </div>
          <div class="rounded-xl border border-input/70 bg-muted/35 p-4">
            <p class="text-sm text-muted-foreground">{{ t('charts.selected') }}</p>
            <p class="mt-1 truncate text-2xl font-semibold">
              {{ selected === null ? '—' : `${data[selected].label} · ${data[selected].value}` }}
            </p>
          </div>
        </div>
        <div
          class="mt-5 rounded-xl border border-input/70"
          :class="
            displayMode === 'overview'
              ? 'min-h-44'
              : displayMode === 'detail'
                ? 'min-h-[34rem]'
                : 'min-h-80'
          "
          :style="{ backgroundColor: chartBackground, padding: `${padding}px` }"
        >
          <h2
            v-if="displayMode !== 'overview'"
            class="mb-2 font-semibold"
            :class="[
              fontSize === 'lg' ? 'text-2xl' : fontSize === 'sm' ? 'text-base' : 'text-xl',
              titleAlign === 'left'
                ? 'text-left'
                : titleAlign === 'right'
                  ? 'text-right'
                  : 'text-center',
            ]"
            :style="{ color: titleColor }"
          >
            {{ title }}
          </h2>
          <p
            v-if="showLegend && displayMode !== 'overview'"
            class="mb-2 text-center text-xs text-muted-foreground"
          >
            <span
              class="mr-1 inline-block size-2 rounded-full"
              :style="{ backgroundColor: colors.primary }"
            />{{ valueColumn
            }}<template
              v-if="
                (chartType === 'line' || chartType === 'area' || chartType === 'bar') &&
                compareData.length
              "
              ><span class="ml-4 mr-1 inline-block size-2 rounded-full bg-amber-500" />{{
                compareColumn
              }}</template
            >
          </p>
          <div class="flex" :style="{ opacity: opacity / 100 }">
            <div
              v-if="usesCartesianAxes && displayMode !== 'overview'"
              class="flex w-10 shrink-0 flex-col items-center justify-center gap-2 border-r border-input/70 pr-2 text-center text-xs text-muted-foreground"
            >
              <span class="font-medium text-foreground [writing-mode:vertical-rl]">{{
                yAxisTitle
              }}</span
              ><span class="[writing-mode:vertical-rl]">{{ yAxisDescription }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <ChartRenderer
                :type="chartType"
                :data="chartData"
                :compare-data="compareData"
                :colors="colors"
                :show-grid="showGrid"
                :show-labels="showLabels"
                :smooth="smooth"
                :stroke-width="strokeWidth"
                :corner-radius="cornerRadius"
                :horizontal="horizontal"
                :selected-index="selected"
                :compact="displayMode === 'overview'"
                @select="selectPoint"
              />
            </div>
          </div>
          <div
            v-if="usesCartesianAxes && displayMode !== 'overview'"
            class="ml-10 flex items-end justify-center border-t border-input/70 pt-2 text-center text-xs text-muted-foreground"
          >
            <div>
              <p class="font-medium text-foreground">{{ xAxisTitle }}</p>
              <p>{{ xAxisDescription }}</p>
            </div>
          </div>
          <div
            v-if="displayMode === 'detail'"
            class="mt-5 grid gap-3 border-t border-input/70 pt-4 sm:grid-cols-3"
          >
            <div class="rounded-lg bg-muted/45 p-3">
              <p class="text-xs text-muted-foreground">{{ t('charts.total') }}</p>
              <p class="text-xl font-semibold">{{ total }}</p>
            </div>
            <div class="rounded-lg bg-muted/45 p-3">
              <p class="text-xs text-muted-foreground">{{ t('charts.average') }}</p>
              <p class="text-xl font-semibold">{{ average }}</p>
            </div>
            <div class="rounded-lg bg-muted/45 p-3">
              <p class="text-xs text-muted-foreground">{{ t('charts.selected') }}</p>
              <p class="text-xl font-semibold">
                {{ chartData[selected]?.label }} · {{ chartData[selected]?.value }}
              </p>
            </div>
          </div>
          <svg
            v-if="false"
            viewBox="0 0 700 290"
            class="h-auto w-full"
            role="img"
            :aria-label="t('charts.preview')"
          >
            <g v-if="showGrid" stroke="currentColor" class="text-border" stroke-dasharray="4 5">
              <line
                v-for="step in 5"
                :key="step"
                x1="54"
                :y1="28 + step * 40"
                x2="646"
                :y2="28 + step * 40"
              />
            </g>
            <g v-if="showLabels" class="fill-muted-foreground text-[12px]">
              <text
                v-for="point in chartPoints"
                :key="point.label"
                :x="point.x"
                y="258"
                text-anchor="middle"
              >
                {{ point.label }}
              </text>
              <text
                v-for="step in 5"
                :key="`scale-${step}`"
                x="42"
                :y="34 + step * 40"
                text-anchor="end"
              >
                {{ Math.round(maxValue - (step * maxValue) / 5) }}
              </text>
            </g>
            <path v-if="chartType === 'area'" :d="areaPath" :fill="colors.fill" opacity=".72" />
            <path
              v-if="chartType === 'line' || chartType === 'area'"
              :d="linePath"
              fill="none"
              :stroke="colors.primary"
              stroke-width="4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <g v-for="point in chartPoints" v-show="chartType === 'bar'" :key="point.label">
              <rect
                :x="point.x - 22"
                :y="point.y"
                width="44"
                :height="228 - point.y"
                rx="7"
                :fill="colors.primary"
                class="cursor-pointer transition-opacity"
                :opacity="selected === null || selected === chartPoints.indexOf(point) ? 1 : 0.35"
                @click="selectPoint(chartPoints.indexOf(point))"
              />
            </g>
            <g
              v-for="(point, index) in chartPoints"
              v-show="chartType !== 'bar'"
              :key="point.label"
            >
              <circle
                :cx="point.x"
                :cy="point.y"
                r="highlighted === index || selected === index ? 8 : 5"
                :fill="colors.primary"
                class="cursor-pointer stroke-card transition-all"
                stroke-width="3"
                @mouseenter="highlighted = index"
                @mouseleave="highlighted = null"
                @click="selectPoint(index)"
              />
              <g v-if="highlighted === index || selected === index">
                <rect
                  :x="point.x - 29"
                  :y="point.y - 39"
                  width="58"
                  height="25"
                  rx="6"
                  class="fill-foreground"
                />
                <text
                  :x="point.x"
                  :y="point.y - 22"
                  text-anchor="middle"
                  class="fill-background text-[12px]"
                >
                  {{ point.value }}
                </text>
              </g>
            </g>
          </svg>
          <svg
            v-if="false"
            viewBox="0 0 700 290"
            class="h-auto w-full"
            role="img"
            :aria-label="t('charts.preview')"
          >
            <g transform="translate(350 145) rotate(-90)">
              <circle
                r="91"
                fill="none"
                stroke="currentColor"
                stroke-width="42"
                class="text-muted"
              />
              <circle
                v-for="segment in donutSegments"
                :key="segment.label"
                r="91"
                fill="none"
                :stroke="colors.primary"
                stroke-width="42"
                pathLength="100"
                :stroke-dasharray="`${segment.dash - 1} ${101 - segment.dash}`"
                :stroke-dashoffset="-segment.offset"
                class="cursor-pointer transition-opacity"
                :opacity="selected === null || selected === segment.index ? 1 : 0.35"
                @click="selectPoint(segment.index)"
              />
            </g>
            <text
              x="350"
              y="138"
              text-anchor="middle"
              class="fill-foreground text-[28px] font-semibold"
            >
              {{ total }}
            </text>
            <text x="350" y="164" text-anchor="middle" class="fill-muted-foreground text-[13px]">
              {{ t('charts.total') }}
            </text>
            <g v-if="showLabels" class="fill-muted-foreground text-[13px]">
              <text
                v-for="(segment, index) in donutSegments"
                :key="segment.label"
                x="525"
                :y="78 + index * 27"
              >
                {{ segment.label }} · {{ segment.value }}
              </text>
            </g>
          </svg>
        </div>
      </div>

      <aside v-if="false" class="space-y-5">
        <div class="rounded-2xl border border-input bg-card p-5">
          <h2 class="font-semibold">{{ t('charts.configuration') }}</h2>
          <div class="mt-4 space-y-4">
            <label class="block text-sm font-medium"
              >{{ t('charts.palette')
              }}<select
                v-model="palette"
                class="mt-1.5 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="indigo">Indigo</option>
                <option value="emerald">Emerald</option>
                <option value="rose">Rose</option>
              </select></label
            ><label class="flex cursor-pointer items-center justify-between gap-3 text-sm"
              ><span>{{ t('charts.showGrid') }}</span
