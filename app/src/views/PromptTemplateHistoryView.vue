<script setup lang="ts">
import { toastError } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import ContentSkeleton from '../components/ContentSkeleton.vue';
import type { PromptRevision } from '../composables/usePromptTemplates';
import { promptFailureI18n, usePromptTemplates } from '../composables/usePromptTemplates';

const { t, locale } = useI18n();
const router = useRouter();
const { loadRevisionHistory } = usePromptTemplates();

const loading = ref(true);
const loadFailed = ref(false);
const revisions = ref<PromptRevision[]>([]);
const openId = ref<string | null>(null);

onMounted(async () => {
  try {
    revisions.value = await loadRevisionHistory();
    loadFailed.value = false;
  } catch (caught) {
    loadFailed.value = true;
    toastError(t(promptFailureI18n(caught)), t('toast.error'));
  } finally {
    loading.value = false;
  }
});

function goBack() {
  void router.push({ name: 'console-prompts' });
}

function openTemplate(revision: PromptRevision) {
  void router.push({ name: 'prompt-template-view', params: { id: revision.templateId } });
}

function toggleDiff(id: string) {
  openId.value = openId.value === id ? null : id;
}

function formatCreatedAt(value: string) {
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
  <section class="ag-page">
    <div class="ag-hero mb-8 flex items-start gap-3 p-6">
      <button
        type="button"
        class="mt-0.5 rounded-xl border border-input p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        :aria-label="t('prompts.backToList')"
        @click="goBack"
      >
        <Icon icon="lucide:arrow-left" width="18" height="18" aria-hidden="true" />
      </button>
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">{{ t('prompts.history') }}</h1>
        <p class="mt-2 text-muted-foreground">{{ t('prompts.historyDescription') }}</p>
      </div>
    </div>

    <ContentSkeleton v-if="loading" kind="table" :label="t('prompts.historyLoading')" />
    <div
      v-else-if="loadFailed"
      class="rounded-2xl border border-dashed border-input px-6 py-16 text-center"
    >
      <h2 class="text-lg font-semibold">{{ t('prompts.loadError') }}</h2>
      <button class="ag-btn ag-btn-info mt-5" type="button" @click="goBack">
        {{ t('prompts.backToList') }}
      </button>
    </div>
    <div
      v-else-if="revisions.length === 0"
      class="rounded-2xl border border-dashed border-input px-6 py-16 text-center"
    >
      <h2 class="text-lg font-semibold">{{ t('prompts.historyEmpty') }}</h2>
    </div>
    <div
      v-else
      class="overflow-hidden rounded-3xl border border-primary/10 bg-card shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)]"
    >
      <div class="overflow-x-auto">
        <table class="w-full table-fixed text-left text-sm">
          <thead>
            <tr
              class="border-b border-input/70 text-xs tracking-wide text-muted-foreground uppercase"
            >
              <th
                class="hidden w-[20%] px-5 py-3.5 font-medium whitespace-nowrap md:table-cell lg:w-[18%]"
              >
                {{ t('prompts.updatedAt') }}
              </th>
              <th class="w-[48%] px-5 py-3.5 font-medium sm:w-[32%] md:w-[22%] lg:w-[20%]">
                {{ t('prompts.name') }}
              </th>
              <th class="hidden w-[12%] px-5 py-3.5 font-medium lg:table-cell">
                {{ t('prompts.version') }}
              </th>
              <th class="w-[40%] px-5 py-3.5 font-medium sm:w-[36%] md:w-[28%] lg:w-[26%]">
                {{ t('prompts.message') }}
              </th>
              <th
                class="hidden w-[20%] px-5 py-3.5 font-medium sm:table-cell md:w-[18%] lg:w-[16%]"
              >
                {{ t('prompts.author') }}
              </th>
              <th
                class="w-[12%] px-5 py-3.5 text-right font-medium sm:w-[12%] md:w-[12%] lg:w-[8%]"
              >
                <span class="sr-only">{{ t('prompts.diff') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="revision in revisions" :key="revision.id">
              <tr class="ag-row border-b border-input/60 last:border-b-0">
                <td
                  class="hidden overflow-hidden px-5 py-4 text-muted-foreground tabular-nums whitespace-nowrap md:table-cell"
                >
                  {{ formatCreatedAt(revision.createdAt) }}
                </td>
                <td class="overflow-hidden px-5 py-4">
                  <button
                    type="button"
                    class="block max-w-full truncate text-left font-medium hover:text-primary"
                    @click="openTemplate(revision)"
                  >
                    {{ revision.name || revision.templateId }}
                  </button>
                  <p v-if="revision.groupName" class="truncate text-xs text-muted-foreground">
                    {{ revision.groupName }}
                  </p>
                </td>
                <td class="hidden overflow-hidden px-5 py-4 lg:table-cell">
                  <div class="truncate font-medium">{{ revision.version }}</div>
                  <div class="truncate text-xs text-muted-foreground">
                    {{ t('prompts.revision', { revision: revision.revision }) }}
                  </div>
                </td>
                <td class="overflow-hidden px-5 py-4">
                  <p class="line-clamp-2">{{ revision.message }}</p>
                </td>
                <td class="hidden overflow-hidden px-5 py-4 text-muted-foreground sm:table-cell">
                  <span class="block truncate">{{ revision.author }}</span>
                </td>
                <td class="px-5 py-4 text-right">
                  <button
                    type="button"
                    class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    :aria-expanded="openId === revision.id"
                    :aria-label="
                      t(openId === revision.id ? 'prompts.hideDiff' : 'prompts.showDiff')
                    "
                    @click="toggleDiff(revision.id)"
                  >
                    <Icon
                      :icon="openId === revision.id ? 'lucide:chevron-up' : 'lucide:diff'"
                      width="16"
                      height="16"
                      aria-hidden="true"
                    />
                  </button>
                </td>
              </tr>
              <tr v-if="openId === revision.id" class="border-b border-input/60 bg-accent/30">
                <td class="px-5 py-4" colspan="6">
                  <p class="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {{ t('prompts.diff') }}
                  </p>
                  <pre
                    class="overflow-x-auto font-mono text-xs leading-5 whitespace-pre-wrap text-foreground"
                    >{{ revision.diff || '—' }}</pre>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
