<script setup lang="ts">
import { Dialog, toastError } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  type CliExecutionResult,
  cliExecutionFailureI18n,
  createCliExecution,
  parseEnvLines,
} from '../api/cliExecutions';

const { t } = useI18n();

const command = ref('');
const environmentText = ref('');
const draftEnvironmentText = ref('');
const envDialogOpen = ref(false);
const running = ref(false);
const result = ref<CliExecutionResult | null>(null);

const canRun = computed(() => command.value.trim().length > 0 && !running.value);
const envCount = computed(() => Object.keys(parseEnvLines(environmentText.value) ?? {}).length);
const hasStderr = computed(() => Boolean(result.value?.stderr?.trim()));

function openEnvDialog() {
  draftEnvironmentText.value = environmentText.value;
  envDialogOpen.value = true;
}

function saveEnvDialog() {
  environmentText.value = draftEnvironmentText.value;
  envDialogOpen.value = false;
}

async function runExecution() {
  const trimmed = command.value.trim();
  if (!trimmed || running.value) return;
  running.value = true;
  result.value = null;
  try {
    result.value = await createCliExecution({
      script: trimmed,
      environment: parseEnvLines(environmentText.value),
    });
  } catch (caught) {
    const detail = caught instanceof Error ? caught.message : '';
    toastError(detail || t(cliExecutionFailureI18n(caught)), t('toast.error'));
  } finally {
    running.value = false;
  }
}
</script>

<template>
  <section class="ag-page mx-auto flex w-full max-w-3xl flex-col gap-10">
    <form
      class="group flex items-center gap-1 border-b border-foreground/25 pb-3 transition-colors focus-within:border-foreground dark:border-input dark:focus-within:border-foreground/50"
      @submit.prevent="runExecution"
    >
      <span
        class="select-none font-mono text-sm font-semibold text-foreground/70 dark:text-muted-foreground"
        aria-hidden="true"
        >$</span
      >
      <label class="sr-only" for="cli-command">{{ t('cli.command') }}</label>
      <input
        id="cli-command"
        v-model="command"
        type="text"
        autocomplete="off"
        spellcheck="false"
        class="min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-[15px] text-foreground outline-none placeholder:text-foreground/40 dark:placeholder:text-muted-foreground"
        :placeholder="t('cli.commandPlaceholder')"
        :disabled="running"
      />
      <button
        type="button"
        class="relative rounded-lg p-2 text-foreground/65 transition-colors hover:bg-accent hover:text-foreground dark:text-muted-foreground"
        :title="t('cli.environment')"
        :aria-label="t('cli.environment')"
        @click="openEnvDialog"
      >
        <Icon icon="lucide:braces" width="18" height="18" aria-hidden="true" />
        <span
          v-if="envCount"
          class="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background"
        >
          {{ envCount }}
        </span>
      </button>
      <button
        type="submit"
        class="rounded-lg p-2 text-foreground/65 transition-colors hover:bg-accent hover:text-foreground disabled:opacity-35 dark:text-muted-foreground"
        :disabled="!canRun"
        :aria-label="running ? t('cli.running') : t('cli.run')"
        :title="running ? t('cli.running') : t('cli.run')"
      >
        <Icon
          :icon="running ? 'lucide:loader-circle' : 'lucide:corner-down-left'"
          width="18"
          height="18"
          :class="{ 'animate-spin': running }"
          aria-hidden="true"
        />
      </button>
    </form>

    <div
      v-if="result"
      class="space-y-5 rounded-2xl border border-foreground/15 bg-muted/60 p-5 font-mono text-sm dark:border-input dark:bg-muted/40"
    >
      <div class="flex items-baseline gap-4 text-foreground/55 dark:text-muted-foreground">
        <span
          class="font-medium"
          :class="result.exitCode === 0 ? 'text-foreground' : 'text-rose-700 dark:text-rose-400'"
        >
          {{ t('cli.exitCode', { code: result.exitCode }) }}
        </span>
        <span v-if="result.durationMs != null">{{
          t('cli.duration', { ms: result.durationMs })
        }}</span>
      </div>

      <div class="space-y-2">
        <p
          class="text-xs font-medium tracking-wide text-foreground/50 uppercase dark:text-muted-foreground"
        >
          {{ t('cli.stdout') }}
        </p>
        <pre
          class="overflow-x-auto whitespace-pre-wrap text-[13px] leading-relaxed text-foreground"
          >{{ result.stdout || t('cli.emptyOutput') }}</pre>
      </div>

      <div v-if="hasStderr" class="space-y-2">
        <p
          class="text-xs font-medium tracking-wide text-foreground/50 uppercase dark:text-muted-foreground"
        >
          {{ t('cli.stderr') }}
        </p>
        <pre
          class="overflow-x-auto whitespace-pre-wrap text-[13px] leading-relaxed text-rose-800 dark:text-rose-300"
          >{{ result.stderr }}</pre>
      </div>
    </div>

    <Dialog :open="envDialogOpen" @update:open="envDialogOpen = $event">
      <form @submit.prevent="saveEnvDialog">
        <h2 class="text-lg font-semibold tracking-tight text-foreground">
          {{ t('cli.environment') }}
        </h2>
        <p class="mt-1.5 text-sm text-foreground/60 dark:text-muted-foreground">
          {{ t('cli.environmentHint') }}
        </p>
        <textarea
          id="cli-env"
          v-model="draftEnvironmentText"
          rows="7"
          spellcheck="false"
          class="mt-5 w-full resize-none rounded-xl border border-foreground/20 bg-background px-3 py-2.5 font-mono text-sm text-foreground outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-ring dark:border-input dark:placeholder:text-muted-foreground"
          :placeholder="t('cli.environmentPlaceholder')"
          :aria-label="t('cli.environment')"
        />
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="ag-btn ag-btn-ghost" @click="envDialogOpen = false">
            {{ t('cli.cancel') }}
          </button>
          <button type="submit" class="ag-btn ag-btn-primary">
            {{ t('cli.saveEnvironment') }}
          </button>
        </div>
      </form>
    </Dialog>
  </section>
</template>
