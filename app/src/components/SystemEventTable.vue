<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useI18n } from 'vue-i18n';

import { EVENT_PAGE_SIZES, type SystemEvent } from '../composables/useSystemEvents';

defineProps<{
  events: SystemEvent[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  paging: boolean;
}>();

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
}>();

const { t, locale } = useI18n();

function formatOccurredAt(value: string) {
  return new Date(value).toLocaleString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <div
    class="overflow-hidden rounded-3xl border border-primary/10 bg-card shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)]"
  >
    <div
      class="flex items-center justify-between gap-3 border-b border-input/70 bg-gradient-to-r from-primary/10 via-card to-warning/10 px-5 py-3.5"
    >
      <div class="flex items-center gap-2 text-sm font-medium">
        <Icon
          icon="lucide:scroll-text"
          width="16"
          height="16"
          class="text-primary"
          aria-hidden="true"
        />
        {{ t('events.tableTitle') }}
      </div>
      <span
        class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary tabular-nums"
      >
        {{ t('events.tableCount', { count: totalElements }) }}
      </span>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full table-fixed text-left text-sm">
        <thead>
          <tr
            class="border-b border-input/70 text-xs tracking-wide text-muted-foreground uppercase"
          >
            <th class="w-[42%] px-5 py-3.5 font-medium sm:w-[28%] md:w-[22%]">
              {{ t('events.name') }}
            </th>
            <th class="hidden w-[22%] px-5 py-3.5 font-medium sm:table-cell md:w-[16%]">
              {{ t('events.domain') }}
            </th>
            <th class="hidden w-[16%] px-5 py-3.5 font-medium md:table-cell">
              {{ t('events.operator') }}
            </th>
            <th class="w-[58%] px-5 py-3.5 font-medium sm:w-[50%] md:w-[26%]">
              {{ t('events.comment') }}
            </th>
            <th class="hidden w-[20%] px-5 py-3.5 font-medium whitespace-nowrap md:table-cell">
              {{ t('events.occurredAt') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="event in events"
            :key="event.id"
            class="ag-row border-b border-input/60 last:border-b-0"
          >
            <td class="overflow-hidden px-5 py-4 font-medium tracking-tight text-foreground">
              <span class="block truncate">{{ event.name }}</span>
            </td>
            <td class="hidden overflow-hidden px-5 py-4 sm:table-cell">
              <span
                class="inline-flex max-w-full items-center truncate rounded-full border border-input bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground"
              >
                {{ event.domain }}
              </span>
            </td>
            <td class="hidden overflow-hidden px-5 py-4 text-foreground md:table-cell">
              <span class="block truncate">{{ event.operator }}</span>
            </td>
            <td class="overflow-hidden px-5 py-4 text-muted-foreground">
              <span class="line-clamp-2" :title="event.comment || undefined">
                {{ event.comment || t('events.noComment') }}
              </span>
            </td>
            <td
              class="hidden overflow-hidden px-5 py-4 whitespace-nowrap text-muted-foreground tabular-nums md:table-cell"
            >
              {{ formatOccurredAt(event.occurredAt) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav
      class="flex flex-col gap-3 border-t border-input/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
      :aria-label="t('events.pagination')"
    >
      <label class="flex items-center gap-2 text-xs text-muted-foreground">
        {{ t('events.pageSize') }}
        <select
          class="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground disabled:opacity-50"
          :value="pageSize"
          :disabled="paging"
          :aria-label="t('events.pageSize')"
          @change="emit('pageSize', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="size in EVENT_PAGE_SIZES" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>
      <div class="flex items-center justify-end gap-2">
        <button
          type="button"
          class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          :disabled="paging || first"
          :aria-label="t('events.previousPage')"
          @click="emit('page', page - 1)"
        >
          <Icon icon="lucide:chevron-left" width="16" height="16" aria-hidden="true" />
        </button>
        <span
          class="min-w-28 text-center text-xs text-muted-foreground tabular-nums"
          aria-live="polite"
        >
          {{ t('events.pageStatus', { page, pages: Math.max(totalPages, 1) }) }}
        </span>
        <button
          type="button"
          class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          :disabled="paging || last"
          :aria-label="t('events.nextPage')"
          @click="emit('page', page + 1)"
        >
          <Icon icon="lucide:chevron-right" width="16" height="16" aria-hidden="true" />
        </button>
      </div>
    </nav>
  </div>
</template>
