<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  AGENT_MODES,
  PLACEHOLDER_APIS,
  PLACEHOLDER_DATABASES,
  PLACEHOLDER_KNOWLEDGE,
  type AgentMode,
  type ComposerOption,
  useComposerConfig,
} from '../composables/useComposerConfig';

defineProps<{
  disabled?: boolean;
}>();

const { t } = useI18n();
const root = ref<HTMLElement | null>(null);
const {
  state,
  openBlock,
  loadingBlock,
  loadError,
  workspaceOptions,
  mcpOptions,
  a2aOptions,
  toggleBlock,
  closeBlock,
  selectWorkspace,
  toggleMulti,
  setAgentMode,
  toStreamMetadata,
  reset,
} = useComposerConfig();

const workspaceId = computed(() => state.value.workspaceId);

defineExpose({
  toStreamMetadata,
  reset,
  state,
  workspaceId,
});

const blocks: Array<{
  id: string;
  icon: string;
  labelKey: string;
  count: () => number;
}> = [
  {
    id: 'workspace',
    icon: 'lucide:folder',
    labelKey: 'composerConfig.workspace',
    count: () => (state.value.workspaceId ? 1 : 0),
  },
  {
    id: 'databases',
    icon: 'lucide:database',
    labelKey: 'composerConfig.databases',
    count: () => state.value.databaseIds.length,
  },
  {
    id: 'mcp',
    icon: 'lucide:cable',
    labelKey: 'composerConfig.mcp',
    count: () => state.value.mcpServerIds.length,
  },
  {
    id: 'a2a',
    icon: 'lucide:bot',
    labelKey: 'composerConfig.a2a',
    count: () => state.value.a2aAgentIds.length,
  },
  {
    id: 'apis',
    icon: 'lucide:webhook',
    labelKey: 'composerConfig.apis',
    count: () => state.value.apiIds.length,
  },
  {
    id: 'knowledge',
    icon: 'lucide:book-open',
    labelKey: 'composerConfig.knowledge',
    count: () => state.value.knowledgeBaseIds.length,
  },
  {
    id: 'mode',
    icon: 'lucide:sliders-horizontal',
    labelKey: 'composerConfig.mode',
    count: () => (state.value.agentMode !== 'auto' ? 1 : 0),
  },
];

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null;
  if (!target || !root.value) return;
  if (!root.value.contains(target)) closeBlock();
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown);
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown);
});

function optionsFor(blockId: string): ComposerOption[] {
  if (blockId === 'workspace') return workspaceOptions.value;
  if (blockId === 'databases') return PLACEHOLDER_DATABASES;
  if (blockId === 'mcp') return mcpOptions.value;
  if (blockId === 'a2a') return a2aOptions.value;
  if (blockId === 'apis') return PLACEHOLDER_APIS;
  if (blockId === 'knowledge') return PLACEHOLDER_KNOWLEDGE;
  return AGENT_MODES.map((mode) => ({
    id: mode,
    label: t(`composerConfig.modes.${mode}`),
    description: t(`composerConfig.modeHints.${mode}`),
  }));
}

function isChecked(blockId: string, optionId: string): boolean {
  const s = state.value;
  if (blockId === 'workspace') return s.workspaceId === optionId;
  if (blockId === 'databases') return s.databaseIds.includes(optionId);
  if (blockId === 'mcp') return s.mcpServerIds.includes(optionId);
  if (blockId === 'a2a') return s.a2aAgentIds.includes(optionId);
  if (blockId === 'apis') return s.apiIds.includes(optionId);
  if (blockId === 'knowledge') return s.knowledgeBaseIds.includes(optionId);
  if (blockId === 'mode') return s.agentMode === optionId;
  return false;
}

function onToggleOption(blockId: string, optionId: string) {
  if (blockId === 'workspace') {
    selectWorkspace(optionId);
    return;
  }
  if (blockId === 'mode') {
    setAgentMode(optionId as AgentMode);
    return;
  }
  if (blockId === 'databases') toggleMulti('databaseIds', optionId);
  if (blockId === 'mcp') toggleMulti('mcpServerIds', optionId);
  if (blockId === 'a2a') toggleMulti('a2aAgentIds', optionId);
  if (blockId === 'apis') toggleMulti('apiIds', optionId);
  if (blockId === 'knowledge') toggleMulti('knowledgeBaseIds', optionId);
}

function isPlaceholder(blockId: string): boolean {
  return blockId === 'databases' || blockId === 'apis' || blockId === 'knowledge';
}
</script>

<template>
  <div ref="root" class="relative flex min-w-0 flex-1 flex-wrap items-center gap-1">
    <div v-for="block in blocks" :key="block.id" class="relative">
      <button
        type="button"
        class="inline-flex max-w-[9.5rem] items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors"
        :class="
          openBlock === block.id || block.count() > 0
            ? 'border-primary/40 bg-primary/10 text-foreground'
            : 'border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
        "
        :aria-expanded="openBlock === block.id"
        :aria-label="t(block.labelKey)"
        :disabled="disabled"
        @click.stop="toggleBlock(block.id)"
      >
        <Icon :icon="block.icon" width="14" height="14" class="shrink-0" aria-hidden="true" />
        <span class="truncate">{{ t(block.labelKey) }}</span>
        <span
          v-if="block.count() > 0"
          class="rounded-full bg-primary/15 px-1.5 text-[10px] font-medium text-primary"
        >
          {{ block.count() }}
        </span>
        <Icon
          icon="lucide:chevron-up"
          width="12"
          height="12"
          class="shrink-0 opacity-70 transition-transform"
          :class="openBlock === block.id ? 'rotate-180' : ''"
          aria-hidden="true"
        />
      </button>

      <div
        v-if="openBlock === block.id"
        class="absolute bottom-[calc(100%+0.4rem)] left-0 z-30 w-72 rounded-xl border border-input bg-card p-2 shadow-xl shadow-foreground/10"
        role="dialog"
        :aria-label="t(block.labelKey)"
      >
        <p class="px-1 pb-2 text-[11px] text-muted-foreground">
          {{ t(`composerConfig.hints.${block.id}`) }}
        </p>
        <p
          v-if="isPlaceholder(block.id)"
          class="mb-2 rounded-lg bg-muted/50 px-2 py-1.5 text-[11px] text-muted-foreground"
        >
          {{ t('composerConfig.comingSoon') }}
        </p>
        <p
          v-if="loadingBlock === block.id"
          class="px-1 py-3 text-xs text-muted-foreground"
        >
          {{ t('composerConfig.loading') }}
        </p>
        <p
          v-else-if="loadError && ['workspace', 'mcp', 'a2a'].includes(block.id)"
          class="px-1 py-3 text-xs text-destructive"
        >
          {{ t('composerConfig.loadFailed') }}
        </p>
        <ul v-else-if="optionsFor(block.id).length" class="max-h-56 space-y-1 overflow-y-auto">
          <li v-for="option in optionsFor(block.id)" :key="option.id">
            <label
              class="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              <input
                class="mt-0.5"
                :type="block.id === 'workspace' || block.id === 'mode' ? 'radio' : 'checkbox'"
                :name="`composer-${block.id}`"
                :checked="isChecked(block.id, option.id)"
                :disabled="disabled || option.disabled"
                @change="onToggleOption(block.id, option.id)"
              />
              <span class="min-w-0 flex-1">
                <span class="block truncate font-medium">{{ option.label }}</span>
                <span
                  v-if="option.description"
                  class="block truncate text-[11px] text-muted-foreground"
                >
                  {{ option.description }}
                </span>
              </span>
            </label>
          </li>
        </ul>
        <p v-else class="px-1 py-3 text-xs text-muted-foreground">
          {{ t('composerConfig.empty') }}
        </p>
      </div>
    </div>
  </div>
</template>
