<script setup lang="ts">
import { ResourceIcon } from '@agentgo/ui';
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
  selectedIds: string[];
}>();

const emit = defineEmits<{
  view: [template: PromptTemplate];
  download: [template: PromptTemplate];
  edit: [template: PromptTemplate];
  remove: [template: PromptTemplate];
  toggle: [id: string];
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
      class="flex items-center justify-between gap-3 border-b border-input/70 bg-gradient-to-r from-primary/10 via-card to-warning/10 px-5 py-3.5"
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
      <table class="w-full table-fixed text-left text-sm">
        <thead>
          <tr
            class="border-b border-input/70 text-xs tracking-wide text-muted-foreground uppercase"
          >
            <th class="w-[58%] px-5 py-3.5 font-medium sm:w-[40%] md:w-[24%] lg:w-[22%]">
              {{ t('prompts.name') }}
            </th>
            <th class="hidden w-[14%] px-5 py-3.5 font-medium md:table-cell lg:w-[12%]">
              {{ t('prompts.group') }}
            </th>
            <th class="hidden w-[28%] px-5 py-3.5 font-medium sm:table-cell md:w-[16%] lg:w-[15%]">
              {{ t('prompts.engine') }}
            </th>
            <th class="hidden w-[13%] px-5 py-3.5 font-medium lg:table-cell">
              {{ t('prompts.version') }}
            </th>
            <th
              class="hidden w-[24%] px-5 py-3.5 font-medium whitespace-nowrap md:table-cell lg:w-[20%]"
            >
              {{ t('prompts.updatedAt') }}
            </th>
            <th class="w-[42%] px-5 py-3.5 text-right font-medium sm:w-[32%] md:w-[22%] lg:w-[18%]">
              {{ t('prompts.actions') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="template in templates"
            :key="template.id"
            class="ag-row group cursor-pointer border-b border-input/60 last:border-b-0"
            :class="selectedIds.includes(template.id) ? 'bg-primary/5' : ''"
            @click="emit('view', template)"
          >
            <td class="overflow-hidden px-5 py-4">
              <div class="flex min-w-0 items-start gap-3">
                <input
                  type="checkbox"
                  class="mt-2 size-4 shrink-0 rounded border-input accent-primary"
                  :checked="selectedIds.includes(template.id)"
                  :aria-label="t('selection.select', { name: template.name })"
                  @click.stop
                  @change="emit('toggle', template.id)"
                />
                <span
                  class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl text-white"
                  :style="{ backgroundColor: template.color }"
                >
                  <ResourceIcon v-if="template.icon" :icon="template.icon" :size="16" />
                  <Icon
                    v-else
                    icon="lucide:message-square-text"
                    width="16"
                    height="16"
                    aria-hidden="true"
                  />
                </span>
                <div class="flex min-w-0 flex-col gap-1">
                  <span class="truncate font-medium tracking-tight text-foreground">{{
                    template.name
                  }}</span>
                  <span class="truncate text-xs text-muted-foreground">
                    {{ template.description || t('prompts.noDescription') }}
                  </span>
                  <span v-if="template.tags.length" class="mt-1 flex flex-wrap gap-1">
                    <span
                      v-for="tag in template.tags"
                      :key="tag"
                      class="ag-tag"
                      :style="{ '--ag-tag': template.color }"
                      >{{ tag }}</span
                    >
                  </span>
                </div>
              </div>
            </td>
            <td class="hidden overflow-hidden px-5 py-4 text-muted-foreground md:table-cell">
              <span class="block truncate">{{ template.groupName || '—' }}</span>
            </td>
            <td class="hidden px-5 py-4 sm:table-cell">
              <span
                class="inline-flex items-center rounded-full border border-input bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground group-hover:border-primary/30 group-hover:text-foreground"
              >
                {{ engineLabel(template.engine) }}
              </span>
            </td>
            <td class="hidden px-5 py-4 lg:table-cell">
              <div class="flex flex-col gap-0.5">
                <span class="font-medium">{{ template.version }}</span>
                <span class="text-xs text-muted-foreground">
                  {{ t('prompts.revision', { revision: template.revision }) }}
                </span>
              </div>
            </td>
            <td
              class="hidden overflow-hidden px-5 py-4 text-muted-foreground tabular-nums whitespace-nowrap md:table-cell"
            >
              {{ formatUpdatedAt(template.updatedAt) }}
            </td>
            <td class="px-5 py-4 text-right whitespace-normal sm:whitespace-nowrap" @click.stop>
              <button
                type="button"
                class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                :aria-label="t('prompts.view')"
                @click="emit('view', template)"
              >
                <Icon icon="lucide:eye" width="16" height="16" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                :aria-label="t('prompts.download')"
                @click="emit('download', template)"
              >
                <Icon icon="lucide:download" width="16" height="16" aria-hidden="true" />
              </button>
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
