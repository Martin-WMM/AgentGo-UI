import { computed, ref } from 'vue';

import { batchDeleteIds } from '../api/batchDelete';
import { FileRequestError, apiData, apiRequest } from '../api/fileRequest';

/** Operator statuses returned by `/api/v1/a2aAgents`. */
export const a2aAgentStatuses = ['UNKNOWN', 'AVAILABLE', 'UNAVAILABLE', 'ERROR'] as const;

export type A2aAgentStatus = (typeof a2aAgentStatuses)[number];

/** User-owned A2A agent returned by the API. */
export interface ManagedA2aAgent {
  id: string;
  cardUrl: string;
  groupName: string;
  name: string;
  description: string;
  tags: string[];
  metadata: Record<string, unknown>;
  descriptionVector: number[];
  enabled: boolean;
  status: A2aAgentStatus;
  createdAt: string;
  updatedAt: string;
}

/** Fields sent when creating or replacing an A2A agent. */
export interface A2aAgentInput {
  cardUrl: string;
  groupName: string;
  name: string;
  description: string;
  tags: string[];
  metadata: Record<string, unknown>;
  enabled: boolean;
  status: A2aAgentStatus;
}

interface A2aAgentDto {
  id: string | number;
  cardUrl: string;
  groupName?: string | null;
  name: string;
  description?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
  descriptionVector?: number[] | null;
  enabled: boolean;
  status: A2aAgentStatus;
  createdAt: string;
  updatedAt: string;
}

const agents = ref<ManagedA2aAgent[]>([]);

function toAgent(dto: A2aAgentDto): ManagedA2aAgent {
  return {
    id: String(dto.id),
    cardUrl: dto.cardUrl.trim(),
    groupName: dto.groupName?.trim() || 'default',
    name: dto.name,
    description: dto.description?.trim() ?? '',
    tags: (dto.tags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0),
    metadata: dto.metadata ?? {},
    descriptionVector: Array.isArray(dto.descriptionVector) ? dto.descriptionVector : [],
    enabled: dto.enabled,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function requestBody(input: A2aAgentInput) {
  return {
    cardUrl: input.cardUrl.trim(),
    groupName: input.groupName.trim() || 'default',
    name: input.name.trim(),
    description: input.description.trim() || null,
    tags: input.tags,
    metadata: input.metadata,
    enabled: input.enabled,
    status: input.status,
  };
}

/**
 * Maps an A2A agents API failure onto an i18n message key.
 *
 * @param caught error thrown by the shared API client
 * @param action whether the failure happened while loading or saving
 * @returns catalog key under `a2a`
 */
export function a2aFailureI18n(caught: unknown, action: 'load' | 'save' = 'save'): string {
  if (!(caught instanceof FileRequestError)) {
    return action === 'load' ? 'a2a.loadError' : 'a2a.saveError';
  }
  if (caught.errorCode === 'A2A-001' || caught.status === 404) return 'a2a.notFound';
  if (caught.errorCode === 'A2A-002' || caught.status === 400) return 'a2a.invalid';
  if (caught.errorCode === 'A2A-003' || caught.status === 409) return 'a2a.duplicateName';
  if (caught.errorCode === 'AUTH-002' || caught.status === 401) return 'a2a.authError';
  return action === 'load' ? 'a2a.loadError' : 'a2a.saveError';
}

/** Loads and mutates the signed-in user's A2A agents. */
export function useA2aAgents() {
  const sortedAgents = computed(() =>
    [...agents.value].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  );

  async function refreshAgents() {
    const data = await apiData<A2aAgentDto[]>('/api/v1/a2aAgents');
    agents.value = data.map(toAgent);
  }

  async function getAgent(id: string) {
    const cached = agents.value.find((item) => item.id === id);
    if (cached) return cached;
    const data = await apiData<A2aAgentDto>(`/api/v1/a2aAgents/${encodeURIComponent(id)}`);
    const agent = toAgent(data);
    agents.value = [agent, ...agents.value.filter((item) => item.id !== agent.id)];
    return agent;
  }

  async function createAgent(input: A2aAgentInput) {
    const created = await apiData<A2aAgentDto>('/api/v1/a2aAgents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody(input)),
    });
    const agent = toAgent(created);
    agents.value = [agent, ...agents.value.filter((item) => item.id !== agent.id)];
    return agent;
  }

  async function updateAgent(id: string, input: A2aAgentInput) {
    const updated = await apiData<A2aAgentDto>(`/api/v1/a2aAgents/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody(input)),
    });
    const agent = toAgent(updated);
    agents.value = agents.value.map((item) => (item.id === id ? agent : item));
    return agent;
  }

  async function removeAgent(id: string) {
    await apiRequest(`/api/v1/a2aAgents/${encodeURIComponent(id)}`, { method: 'DELETE' });
    agents.value = agents.value.filter((item) => item.id !== id);
  }

  async function removeAgents(ids: string[]) {
    await batchDeleteIds('/api/v1/a2aAgents/batch-delete', ids);
    const removed = new Set(ids);
    agents.value = agents.value.filter((item) => !removed.has(item.id));
  }

  return {
    agents: sortedAgents,
    refreshAgents,
    getAgent,
    createAgent,
    updateAgent,
    removeAgent,
    removeAgents,
  };
}
