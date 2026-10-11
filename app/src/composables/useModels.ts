import { computed, ref } from 'vue';

import { FileRequestError, apiData, apiRequest } from '../api/fileRequest';

/** Capability categories accepted by `/api/v1/models`. */
export const modelTypes = [
  'LLM',
  'MULTIMODAL',
  'EMBEDDING',
  'ASR',
  'TTS',
  'SPEECH2SPEECH',
  'OTHER',
] as const;

export type ModelType = (typeof modelTypes)[number];

/** User-owned model configuration returned by the models API. */
export interface ManagedModel {
  id: string;
  name: string;
  provider: string;
  type: ModelType;
  configuration: Record<string, unknown>;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/** Fields sent when creating or replacing a model. */
export interface ModelInput {
  name: string;
  provider: string;
  type: ModelType;
  configuration: Record<string, unknown>;
  description: string;
}

interface ModelDto {
  id: string;
  name: string;
  provider: string;
  type: ModelType;
  configuration?: Record<string, unknown> | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

const models = ref<ManagedModel[]>([]);

function toModel(dto: ModelDto): ManagedModel {
  return {
    id: dto.id,
    name: dto.name,
    provider: dto.provider,
    type: dto.type,
    configuration: dto.configuration ?? {},
    description: dto.description?.trim() ?? '',
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function requestBody(input: ModelInput) {
  return {
    name: input.name.trim(),
    provider: input.provider.trim(),
    type: input.type,
    configuration: input.configuration,
    description: input.description.trim() || null,
  };
}

/**
 * Reads the upstream model identifier stored inside provider configuration.
 *
 * @param configuration provider-specific JSON object
 * @returns trimmed `model` string, or an empty string when it is absent
 */
export function configuredModelName(configuration: Record<string, unknown>): string {
  const model = configuration.model;
  return typeof model === 'string' ? model.trim() : '';
}

/**
 * Maps a models API failure onto an i18n message key.
 *
 * @param caught error thrown by the shared API client
 * @param action whether the failure happened while loading or saving
 * @returns catalog key under `models`
 */
export function modelFailureI18n(caught: unknown, action: 'load' | 'save' = 'save'): string {
  if (!(caught instanceof FileRequestError)) {
    return action === 'load' ? 'models.loadError' : 'models.saveError';
  }
  if (caught.errorCode === 'MODEL-001' || caught.status === 404) return 'models.notFound';
  if (caught.errorCode === 'MODEL-002' || caught.status === 400) return 'models.invalid';
  if (caught.errorCode === 'MODEL-003' || caught.status === 409) return 'models.duplicateName';
  if (caught.errorCode === 'MODEL-004' || caught.status === 403) return 'models.forbidden';
  if (caught.errorCode === 'AUTH-002' || caught.status === 401) return 'models.authError';
  return action === 'load' ? 'models.loadError' : 'models.saveError';
}

/** Loads and mutates the signed-in user's model configurations. */
export function useModels() {
  const sortedModels = computed(() =>
    [...models.value].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  );

  async function refreshModels() {
    const data = await apiData<ModelDto[]>('/api/v1/models');
    models.value = data.map(toModel);
  }

  async function createModel(input: ModelInput) {
    const created = await apiData<ModelDto>('/api/v1/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody(input)),
    });
    const model = toModel(created);
    models.value = [model, ...models.value.filter((item) => item.id !== model.id)];
    return model;
  }

  async function updateModel(id: string, input: ModelInput) {
    const updated = await apiData<ModelDto>(`/api/v1/models/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody(input)),
    });
    const model = toModel(updated);
    models.value = models.value.map((item) => (item.id === id ? model : item));
    return model;
  }

  async function removeModel(id: string) {
    await apiRequest(`/api/v1/models/${encodeURIComponent(id)}`, { method: 'DELETE' });
    models.value = models.value.filter((item) => item.id !== id);
  }

  return {
    models: sortedModels,
    refreshModels,
    createModel,
    updateModel,
    removeModel,
  };
}
