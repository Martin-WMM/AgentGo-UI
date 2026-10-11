<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { configuredModelName, type ManagedModel } from '../composables/useModels';
import { modelPresentation } from '../lib/modelPresentation';

const props = defineProps<{
  model: ManagedModel;
  index: number;
  deleting: boolean;
}>();

const emit = defineEmits<{
  edit: [];
  remove: [];
}>();

const { t } = useI18n();
const style = computed(() => modelPresentation(props.model.type));
const modelName = computed(() => configuredModelName(props.model.configuration));
const updatedAt = computed(() => new Date(props.model.updatedAt).toLocaleString());
</script>

<template>
  <article
    class="group relative flex min-h-56 flex-col overflow-hidden rounded-2xl border bg-background p-5 shadow-sm"
    :style="{
      animationDelay: `${index * 75}ms`,
      borderColor: `color-mix(in srgb, ${style.color} 55%, transparent)`,
      backgroundImage: `linear-gradient(160deg, color-mix(in srgb, ${style.color} 14%, transparent), transparent 42%)`,
    }"
  >
    <div class="absolute inset-x-0 top-0 h-1.5" :style="{ backgroundColor: style.color }" />
    <div
      class="absolute -right-12 -top-12 size-36 rounded-full blur-2xl"
      :style="{ backgroundColor: `color-mix(in srgb, ${style.color} 35%, transparent)` }"
    />
    <button
      type="button"
      class="absolute inset-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      :aria-label="model.name"
      @click="emit('edit')"
    />
    <div class="relative flex items-start justify-between gap-3 pointer-events-none">
      <div class="flex min-w-0 items-center gap-3">
        <div
          class="flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
          :style="{ backgroundColor: style.color }"
        >
          <Icon :icon="style.icon" width="22" height="22" aria-hidden="true" />
        </div>
        <div class="min-w-0">
          <h2 class="truncate text-lg font-semibold">{{ model.name }}</h2>
          <p class="truncate text-sm text-muted-foreground">{{ model.provider }}</p>
        </div>
      </div>
      <div class="pointer-events-auto flex items-center gap-1">
        <button
          type="button"
          class="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          :aria-label="t('models.edit')"
          @click="emit('edit')"
        >
          <Icon icon="lucide:pencil" width="16" height="16" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="rounded-lg p-2 text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
          :aria-label="t('models.delete')"
          :disabled="deleting"
          @click="emit('remove')"
        >
          <Icon icon="lucide:trash-2" width="16" height="16" aria-hidden="true" />
        </button>
      </div>
    </div>
    <div class="relative mt-4 flex flex-wrap items-center gap-2 pointer-events-none">
      <span
        class="rounded-full px-2.5 py-1 text-xs font-medium text-white"
        :style="{ backgroundColor: style.color }"
      >
        {{ t(`models.types.${model.type}`) }}
      </span>
      <span
        v-if="modelName"
        class="max-w-full truncate rounded-full bg-accent px-2.5 py-1 font-mono text-xs text-muted-foreground"
      >
        {{ modelName }}
      </span>
    </div>
    <p class="relative mt-4 line-clamp-3 text-sm text-muted-foreground pointer-events-none">
      {{ model.description || t('models.noDescription') }}
    </p>
    <p class="relative mt-auto pt-5 text-xs text-muted-foreground pointer-events-none">
      {{ t('models.updatedAt', { time: updatedAt }) }}
    </p>
  </article>
</template>
