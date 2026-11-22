<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type { ToolActivityVo } from '../agent/events/types';

defineProps<{
  activities: ToolActivityVo[];
}>();

const { t } = useI18n();
const expanded = ref<Record<string, boolean>>({});

const statusIcon: Record<ToolActivityVo['status'], string> = {
  started: 'lucide:circle',
  running: 'lucide:loader-circle',
  succeeded: 'lucide:check',
  failed: 'lucide:x',
};

function toggle(id: string) {
  expanded.value = { ...expanded.value, [id]: !expanded.value[id] };
}

function kindIcon(kind: ToolActivityVo['kind']): string {
  return kind === 'cli' ? 'lucide:terminal' : 'lucide:wrench';
}
</script>

<template>
  <div
    v-if="activities.length"
    class="rounded-xl border border-input/80 bg-muted/40 px-4 py-3"
  >
    <p class="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <Icon icon="lucide:puzzle" width="14" height="14" aria-hidden="true" />
      {{ t('chat.toolActivity.title') }}
    </p>
    <ul class="space-y-2">
      <li v-for="item in activities" :key="item.id" class="min-w-0">
        <div class="flex items-start gap-2 text-sm">
          <Icon
            :icon="statusIcon[item.status]"
            width="16"
            height="16"
            class="mt-0.5 shrink-0"
            :class="{
              'animate-spin text-primary': item.status === 'running',
              'text-muted-foreground': item.status === 'started',
              'text-emerald-600 dark:text-emerald-400': item.status === 'succeeded',
              'text-destructive': item.status === 'failed',
            }"
            aria-hidden="true"
          />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span class="inline-flex items-center gap-1 font-medium">
                <Icon
                  :icon="kindIcon(item.kind)"
                  width="14"
                  height="14"
                  class="text-muted-foreground"
                  aria-hidden="true"
                />
                {{ item.name }}
              </span>
              <span
                class="rounded-md bg-background/70 px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {{ t(`chat.toolActivity.kind.${item.kind}`) }}
              </span>
              <span class="text-xs text-muted-foreground">
                {{ t(`chat.toolActivity.status.${item.status}`) }}
              </span>
            </div>
            <pre
              v-if="item.input"
              class="mt-2 max-h-40 overflow-auto rounded-lg border border-input/70 bg-background/90 p-2 font-mono text-xs whitespace-pre-wrap text-foreground"
              :aria-label="t('chat.toolActivity.input')"
            ><span class="select-none text-muted-foreground">$ </span>{{ item.input }}</pre>
            <button
              v-if="item.summary"
              type="button"
              class="mt-1 text-left text-xs text-primary hover:underline"
              @click="toggle(item.id)"
            >
              {{
                expanded[item.id]
                  ? t('chat.toolActivity.hideOutput')
                  : t('chat.toolActivity.showOutput')
              }}
            </button>
            <pre
              v-if="item.summary && expanded[item.id]"
              class="mt-2 max-h-48 overflow-auto rounded-lg border border-input/70 bg-background/80 p-2 text-xs whitespace-pre-wrap text-muted-foreground"
            >{{ item.summary }}</pre>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
