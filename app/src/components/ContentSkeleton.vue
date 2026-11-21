<script setup lang="ts">
withDefaults(
  defineProps<{
    kind?: 'cards' | 'table' | 'form';
    label: string;
    count?: number;
  }>(),
  {
    kind: 'cards',
    count: 6,
  },
);
</script>

<template>
  <div role="status" aria-busy="true" :aria-label="label">
    <span class="sr-only">{{ label }}</span>
    <div v-if="kind === 'cards'" class="ag-card-grid">
      <div
        v-for="item in count"
        :key="item"
        class="ag-skeleton-card"
        :style="{ animationDelay: `${item * 60}ms` }"
      >
        <span class="ag-skeleton h-1.5 w-full rounded-none" />
        <div class="flex items-center gap-3 p-5">
          <span class="ag-skeleton size-11 shrink-0 rounded-xl" />
          <span class="min-w-0 flex-1 space-y-2">
            <span class="ag-skeleton h-4 w-2/3" />
            <span class="ag-skeleton h-3 w-1/3" />
          </span>
        </div>
        <div class="space-y-2 px-5 pb-5">
          <span class="ag-skeleton h-3 w-full" />
          <span class="ag-skeleton h-3 w-4/5" />
          <span class="ag-skeleton mt-4 h-3 w-1/2" />
        </div>
      </div>
    </div>
    <div v-else-if="kind === 'table'" class="ag-skeleton-card">
      <div class="flex items-center justify-between border-b border-input/70 px-5 py-4">
        <span class="ag-skeleton h-4 w-36" />
        <span class="ag-skeleton h-5 w-16 rounded-full" />
      </div>
      <div
        v-for="item in count"
        :key="item"
        class="flex items-center gap-4 border-b border-input/50 px-5 py-4 last:border-b-0"
        :style="{ animationDelay: `${item * 50}ms` }"
      >
        <span class="min-w-0 flex-1 space-y-2">
          <span class="ag-skeleton h-4 w-1/3" />
          <span class="ag-skeleton h-3 w-1/2" />
        </span>
        <span class="ag-skeleton hidden h-6 w-20 rounded-full sm:block" />
        <span class="ag-skeleton hidden h-3 w-28 md:block" />
      </div>
    </div>
    <div v-else class="ag-skeleton-card space-y-4 p-6">
      <span class="ag-skeleton h-4 w-40" />
      <span class="ag-skeleton h-11 w-full" />
      <span class="ag-skeleton h-11 w-full" />
      <span class="ag-skeleton h-24 w-full" />
      <div class="flex gap-2 pt-2">
        <span
          v-for="item in 6"
          :key="item"
          class="ag-skeleton size-9 rounded-full"
          :style="{ animationDelay: `${item * 40}ms` }"
        />
      </div>
    </div>
  </div>
</template>
