<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useI18n } from 'vue-i18n';

import { PROMPT_PAGE_SIZES, type PromptTemplate } from '../composables/usePromptTemplates';

defineProps<{
  templates: PromptTemplate[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  paging: boolean;
}>();

const emit = defineEmits<{
  edit: [template: PromptTemplate];
  remove: [template: PromptTemplate];
  page: [page: number];
  pageSize: [pageSize: number];
}>();

const { t, locale } = useI18n();

function engineLabel(engine: PromptTemplate['engine']) {
  return t(`prompts.engines.${engine}`);
}

function formatUpdatedAt(value: string) {
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
      class="flex items-center justify-between gap-3 border-b border-input/70 bg-gradient-to-r from-primary/8 via-background to-cyan-400/8 px-5 py-3.5"
    >
      <div class="flex items-center gap-2 text-sm font-medium">
        <Icon
          icon="lucide:table-2"
          width="16"
          height="16"
          class="text-primary"
          aria-hidden="true"
        />
        {{ t('prompts.tableTitle') }}
      </div>
      <span
        class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary tabular-nums"
      >
        {{ t('prompts.tableCount', { count: totalElements }) }}
      </span>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[40rem] text-left text-sm">
        <thead>
          <tr
            class="border-b border-input/70 text-xs tracking-wide text-muted-foreground uppercase"
          >
            <th class="px-5 py-3.5 font-medium">{{ t('prompts.name') }}</th>
            <th class="hidden px-5 py-3.5 font-medium sm:table-cell">{{ t('prompts.engine') }}</th>
            <th class="hidden px-5 py-3.5 font-medium md:table-cell">
              {{ t('prompts.updatedAt') }}
            </th>
            <th class="px-5 py-3.5 text-right font-medium">
              <span class="sr-only">{{ t('prompts.actions') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="template in templates"
            :key="template.id"
            class="group cursor-pointer border-b border-input/60 last:border-b-0 transition-colors hover:bg-primary/[0.04]"
            @click="emit('edit', template)"
          >
            <td class="px-5 py-4">
              <div class="flex min-w-0 flex-col gap-1">
                <span class="truncate font-medium tracking-tight text-foreground">{{
                  template.name
                }}</span>
                <span class="truncate text-xs text-muted-foreground">
                  {{ template.description || t('prompts.noDescription') }}
                </span>
              </div>
            </td>
            <td class="hidden px-5 py-4 sm:table-cell">
              <span
                class="inline-flex items-center rounded-full border border-input bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground group-hover:border-primary/30 group-hover:text-foreground"
              >
                {{ engineLabel(template.engine) }}
              </span>
            </td>
            <td class="hidden px-5 py-4 text-muted-foreground tabular-nums md:table-cell">
              {{ formatUpdatedAt(template.updatedAt) }}
            </td>
            <td class="px-5 py-4 text-right whitespace-nowrap" @click.stop>
              <button
                type="button"
                class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                :aria-label="t('prompts.edit')"
                @click="emit('edit', template)"
              >
                <Icon icon="lucide:pencil" width="16" height="16" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                :aria-label="t('prompts.delete')"
                @click="emit('remove', template)"
              >
                <Icon icon="lucide:trash-2" width="16" height="16" aria-hidden="true" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav
      class="flex flex-col gap-3 border-t border-input/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
      :aria-label="t('prompts.pagination')"
    >
      <label class="flex items-center gap-2 text-xs text-muted-foreground">
        {{ t('prompts.pageSize') }}
        <select
          class="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground disabled:opacity-50"
          :value="pageSize"
          :disabled="paging"
          :aria-label="t('prompts.pageSize')"
          @change="emit('pageSize', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="size in PROMPT_PAGE_SIZES" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>
      <div class="flex items-center justify-end gap-2">
        <button
          type="button"
          class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          :disabled="paging || first"
          :aria-label="t('prompts.previousPage')"
          @click="emit('page', page - 1)"
        >
          <Icon icon="lucide:chevron-left" width="16" height="16" aria-hidden="true" />
        </button>
        <span
          class="min-w-28 text-center text-xs text-muted-foreground tabular-nums"
          aria-live="polite"
        >
          {{ t('prompts.pageStatus', { page, pages: totalPages }) }}
        </span>
        <button
          type="button"
          class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          :disabled="paging || last"
          :aria-label="t('prompts.nextPage')"
          @click="emit('page', page + 1)"
        >
          <Icon icon="lucide:chevron-right" width="16" height="16" aria-hidden="true" />
        </button>
      </div>
    </nav>
  </div>
</template>
