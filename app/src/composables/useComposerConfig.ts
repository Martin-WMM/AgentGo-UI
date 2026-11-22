import { computed, ref } from 'vue';

import { useA2aAgents } from './useA2aAgents';
import { useMcpServers } from './useMcpServers';
import { useWorkspaces } from './useWorkspaces';

/** Selectable agent operating modes for one chat turn. */
export const AGENT_MODES = ['auto', 'ask', 'plan', 'agent'] as const;

export type AgentMode = (typeof AGENT_MODES)[number];

export interface ComposerOption {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface ComposerConfigState {
  workspaceId: string | null;
  databaseIds: string[];
  mcpServerIds: string[];
  a2aAgentIds: string[];
  apiIds: string[];
  knowledgeBaseIds: string[];
  agentMode: AgentMode;
}

/** Placeholder options until Databases / APIs / Knowledge Base backends ship. */
export const PLACEHOLDER_DATABASES: ComposerOption[] = [
  { id: 'demo-pg', label: 'PostgreSQL · demo', description: 'Coming soon' },
  { id: 'demo-mysql', label: 'MySQL · analytics', description: 'Coming soon' },
];

export const PLACEHOLDER_APIS: ComposerOption[] = [
  { id: 'demo-rest', label: 'REST Catalog', description: 'Coming soon' },
  { id: 'demo-openapi', label: 'OpenAPI · billing', description: 'Coming soon' },
];

export const PLACEHOLDER_KNOWLEDGE: ComposerOption[] = [
  { id: 'demo-docs', label: 'Product docs', description: 'Coming soon' },
  { id: 'demo-wiki', label: 'Internal wiki', description: 'Coming soon' },
];

function emptyState(): ComposerConfigState {
  return {
    workspaceId: null,
    databaseIds: [],
    mcpServerIds: [],
    a2aAgentIds: [],
    apiIds: [],
    knowledgeBaseIds: [],
    agentMode: 'auto',
  };
}

/**
 * Holds per-composer resource bindings for the current chat turn.
 */
export function useComposerConfig() {
  const state = ref<ComposerConfigState>(emptyState());
  const openBlock = ref<string | null>(null);
  const loadingBlock = ref<string | null>(null);
  const loadError = ref('');

  const { workspaces, ensureLoaded } = useWorkspaces();
  const { servers, refreshServers } = useMcpServers();
  const { agents, refreshAgents } = useA2aAgents();

  const workspaceOptions = computed<ComposerOption[]>(() =>
    workspaces.value.map((item) => ({
      id: item.id,
      label: item.name,
      description: item.groupName,
    })),
  );

  const mcpOptions = computed<ComposerOption[]>(() =>
    servers.value
      .filter((item) => item.enabled)
      .map((item) => ({
        id: item.id,
        label: item.name,
        description: item.endpointUrl,
      })),
  );

  const a2aOptions = computed<ComposerOption[]>(() =>
    agents.value
      .filter((item) => item.enabled)
      .map((item) => ({
        id: item.id,
        label: item.name,
        description: item.cardUrl,
      })),
  );

  const selectionCount = computed(() => {
    const s = state.value;
    return (
      (s.workspaceId ? 1 : 0) +
      s.databaseIds.length +
      s.mcpServerIds.length +
      s.a2aAgentIds.length +
      s.apiIds.length +
      s.knowledgeBaseIds.length +
      (s.agentMode !== 'auto' ? 1 : 0)
    );
  });

  function toggleBlock(id: string) {
    openBlock.value = openBlock.value === id ? null : id;
    if (openBlock.value) {
      void ensureBlockData(openBlock.value);
    }
  }

  function closeBlock() {
    openBlock.value = null;
  }

  async function ensureBlockData(blockId: string) {
    loadError.value = '';
    loadingBlock.value = blockId;
    try {
      if (blockId === 'workspace') await ensureLoaded();
      if (blockId === 'mcp') await refreshServers();
      if (blockId === 'a2a') await refreshAgents();
    } catch {
      loadError.value = 'loadFailed';
    } finally {
      if (loadingBlock.value === blockId) loadingBlock.value = null;
    }
  }

  function selectWorkspace(id: string | null) {
    state.value.workspaceId = state.value.workspaceId === id ? null : id;
  }

  function toggleMulti(
    key: 'databaseIds' | 'mcpServerIds' | 'a2aAgentIds' | 'apiIds' | 'knowledgeBaseIds',
    id: string,
  ) {
    const current = state.value[key];
    state.value[key] = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];
  }

  function setAgentMode(mode: AgentMode) {
    state.value.agentMode = mode;
  }

  function reset() {
    state.value = emptyState();
    openBlock.value = null;
  }

  /** Flatten bindings into string metadata for the agent stream request. */
  function toStreamMetadata(): Record<string, string> {
    const s = state.value;
    const metadata: Record<string, string> = {
      agentMode: s.agentMode,
    };
    if (s.workspaceId) metadata.workspaceId = s.workspaceId;
    if (s.databaseIds.length) metadata.databaseIds = s.databaseIds.join(',');
    if (s.mcpServerIds.length) metadata.mcpServerIds = s.mcpServerIds.join(',');
    if (s.a2aAgentIds.length) metadata.a2aAgentIds = s.a2aAgentIds.join(',');
    if (s.apiIds.length) metadata.apiIds = s.apiIds.join(',');
    if (s.knowledgeBaseIds.length) metadata.knowledgeBaseIds = s.knowledgeBaseIds.join(',');
    return metadata;
  }

  return {
    state,
    openBlock,
    loadingBlock,
    loadError,
    workspaceOptions,
    mcpOptions,
    a2aOptions,
    selectionCount,
    toggleBlock,
    closeBlock,
    ensureBlockData,
    selectWorkspace,
    toggleMulti,
    setAgentMode,
    reset,
    toStreamMetadata,
  };
}
