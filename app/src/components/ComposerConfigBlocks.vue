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
