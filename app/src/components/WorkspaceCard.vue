<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useI18n } from 'vue-i18n';

import type { Workspace } from '../composables/useWorkspaces';

defineProps<{
  workspace: Workspace;
  index: number;
  deleting: boolean;
}>();

const emit = defineEmits<{
  open: [];
  edit: [];
  remove: [];
}>();

const { t } = useI18n();
</script>

<template>
  <article
    class="workspace-card group relative flex min-h-52 flex-col overflow-hidden rounded-2xl border border-input bg-background p-5 shadow-sm"
    :style="{ animationDelay: `${index * 75}ms` }"
  >
    <div class="card-glow absolute -right-12 -top-12 size-36 rounded-full bg-cyan-400/15 blur-2xl" />
    <Icon
      icon="lucide:stars"
      class="card-stars absolute bottom-4 right-4 text-primary/10"
      width="44"
      height="44"
      aria-hidden="true"
    />
    <button
      type="button"
      class="absolute inset-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      :aria-label="workspace.name"
      @click="emit('open')"
    />
    <div class="relative flex items-start justify-between gap-3 pointer-events-none">
      <div class="flex min-w-0 items-center gap-3">
        <div
          class="folder-icon flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
        >
          <Icon icon="lucide:folder" width="22" height="22" aria-hidden="true" />
        </div>
        <h2 class="truncate text-lg font-semibold">{{ workspace.name }}</h2>
      </div>
      <div class="pointer-events-auto flex items-center gap-1">
        <button
          type="button"
          class="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          :aria-label="t('files.editWorkspace')"
          @click="emit('edit')"
        >
          <Icon icon="lucide:pencil" width="16" height="16" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="rounded-lg p-2 text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
          :aria-label="t('files.deleteWorkspace')"
          :disabled="deleting"
          @click="emit('remove')"
        >
          <Icon icon="lucide:trash-2" width="16" height="16" aria-hidden="true" />
        </button>
      </div>
    </div>
    <p class="relative mt-4 line-clamp-3 min-h-10 text-sm text-muted-foreground pointer-events-none">
      {{ workspace.description || t('files.noDescription') }}
    </p>
    <p
      class="relative mt-auto flex items-center gap-1.5 pt-5 text-xs font-medium text-muted-foreground pointer-events-none"
    >
      <Icon icon="lucide:arrow-up-right" width="14" height="14" aria-hidden="true" />{{
        t('files.openWorkspace')
      }}
    </p>
  </article>
</template>
