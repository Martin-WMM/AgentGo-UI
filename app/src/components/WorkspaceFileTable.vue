<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useI18n } from 'vue-i18n';

import type { WorkspaceFile } from '../composables/useWorkspaces';

defineProps<{
  files: WorkspaceFile[];
  busy: boolean;
}>();

const emit = defineEmits<{
  download: [path: string];
  remove: [file: WorkspaceFile];
}>();

const { t } = useI18n();

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-input">
    <table class="w-full text-left text-sm">
      <thead class="bg-accent/60 text-muted-foreground">
        <tr>
          <th class="px-5 py-3 font-medium">{{ t('files.fileName') }}</th>
          <th class="hidden px-5 py-3 font-medium sm:table-cell">{{ t('files.size') }}</th>
          <th class="hidden px-5 py-3 font-medium md:table-cell">{{ t('files.updatedAt') }}</th>
          <th class="px-5 py-3">
            <span class="sr-only">{{ t('files.actions') }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="file in files" :key="file.path" class="border-t border-input hover:bg-accent">
          <td class="max-w-40 truncate px-5 py-4 font-medium">
            <Icon
              icon="lucide:file"
              class="mr-2 inline text-muted-foreground"
              width="16"
              height="16"
              aria-hidden="true"
            />{{ file.name }}
          </td>
          <td class="hidden px-5 py-4 text-muted-foreground sm:table-cell">
            {{ formatSize(file.sizeBytes) }}
          </td>
          <td class="hidden px-5 py-4 text-muted-foreground md:table-cell">
            {{ new Date(file.updatedAt).toLocaleString() }}
          </td>
          <td class="px-5 py-4 text-right">
            <button
              type="button"
              class="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              :aria-label="t('files.download')"
              @click="emit('download', file.path)"
            >
              <Icon icon="lucide:download" width="16" height="16" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-destructive"
              :aria-label="t('files.delete')"
              :disabled="busy"
              @click="emit('remove', file)"
            >
              <Icon icon="lucide:trash-2" width="16" height="16" aria-hidden="true" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
