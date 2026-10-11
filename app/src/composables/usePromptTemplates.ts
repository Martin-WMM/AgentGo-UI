import { computed, ref } from 'vue';

import { FileRequestError, apiData, apiRequest } from '../api/fileRequest';

export type PromptEngine = 'SIMPLE' | 'JINJA2';

export interface PromptTemplate {
  id: string;
  name: string;
  engine: PromptEngine;
  content: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptTemplateInput {
  name: string;
  engine: PromptEngine;
  content: string;
  description: string;
}

interface PromptTemplateDto {
  id: string;
  name: string;
  engine: PromptEngine;
  content: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PROMPT_PAGE_SIZES = [10, 20, 50] as const;

interface PromptTemplatePageDto {
  data: PromptTemplateDto[];
  pageSize: number;
  totalElements: number;
  totalPages: number;
  empty: boolean;
  first: boolean;
  last: boolean;
  size: number;
  number: number;
}

const templates = ref<PromptTemplate[]>([]);
const loaded = ref(false);
const page = ref(1);
const pageSize = ref<number>(PROMPT_PAGE_SIZES[0]);
const totalElements = ref(0);
const totalPages = ref(0);
const first = ref(true);
const last = ref(true);

function toTemplate(dto: PromptTemplateDto): PromptTemplate {
  return {
    id: dto.id,
    name: dto.name,
    engine: dto.engine,
    content: dto.content,
    description: dto.description?.trim() ?? '',
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function requestBody(input: PromptTemplateInput) {
  return {
    name: input.name.trim(),
    engine: input.engine,
    content: input.content,
    description: input.description.trim() || null,
  };
}

/** Maps a prompt-template API failure onto an i18n message key. */
export function promptFailureI18n(caught: unknown): string {
  if (!(caught instanceof FileRequestError)) return 'prompts.saveError';
  if (caught.errorCode === 'PROMPT-001' || caught.status === 404) return 'prompts.notFound';
  if (caught.errorCode === 'PROMPT-002') return 'prompts.invalid';
  if (caught.errorCode === 'PROMPT-003' || caught.status === 409) return 'prompts.duplicateName';
  if (caught.errorCode === 'PROMPT-004') return 'prompts.renderError';
  if (caught.errorCode === 'PROMPT-005' || caught.status === 403) return 'prompts.forbidden';
  if (caught.errorCode === 'AUTH-002' || caught.status === 401) return 'prompts.authError';
  return 'prompts.saveError';
}

export function usePromptTemplates() {
  const sortedTemplates = computed(() =>
    [...templates.value].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  );

  function showPage(rows: PromptTemplate[], nextPage: number, nextSize: number) {
    const total = rows.length;
    const pages = total === 0 ? 0 : Math.ceil(total / nextSize);
    const safePage = pages === 0 ? 1 : Math.min(Math.max(nextPage, 1), pages);
    const start = (safePage - 1) * nextSize;
    templates.value = rows.slice(start, start + nextSize);
    page.value = safePage;
    pageSize.value = nextSize;
    totalElements.value = total;
    totalPages.value = pages;
    first.value = safePage <= 1;
    last.value = pages === 0 || safePage >= pages;
    loaded.value = true;
  }

  async function refreshTemplates(nextPage = page.value, nextSize = pageSize.value) {
    const params = new URLSearchParams({
      page: String(nextPage),
      size: String(nextSize),
      sort: 'updatedAt',
      order: 'DESC',
    });
    const data = await apiData<PromptTemplatePageDto | PromptTemplateDto[]>(
      `/api/v1/promptTemplates?${params.toString()}`,
    );
    // A restarted backend returns a page object. An older process still returns the full list.
    if (Array.isArray(data)) {
      const rows = data
        .map(toTemplate)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      showPage(rows, nextPage, nextSize);
      return;
    }
    if (data.totalElements > 0 && data.data.length === 0 && nextPage > 1) {
      const lastPage = Math.max(1, data.totalPages);
      if (lastPage !== nextPage) {
        await refreshTemplates(lastPage, nextSize);
        return;
      }
    }
    templates.value = data.data.map(toTemplate);
    page.value = data.number;
    pageSize.value = data.pageSize;
    totalElements.value = data.totalElements;
    totalPages.value = data.totalPages;
    first.value = data.first;
    last.value = data.last;
    loaded.value = true;
  }

  async function getTemplate(id: string) {
    const cached = templates.value.find((item) => item.id === id);
    if (cached) return cached;
    const data = await apiData<PromptTemplateDto>(`/api/v1/promptTemplates/${id}`);
    const template = toTemplate(data);
    templates.value = [template, ...templates.value.filter((item) => item.id !== template.id)];
    return template;
  }

  async function createTemplate(input: PromptTemplateInput) {
    const created = await apiData<PromptTemplateDto>('/api/v1/promptTemplates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody(input)),
    });
    const template = toTemplate(created);
    templates.value = [template, ...templates.value.filter((item) => item.id !== template.id)];
    return template;
  }

  async function updateTemplate(id: string, input: PromptTemplateInput) {
    const updated = await apiData<PromptTemplateDto>(`/api/v1/promptTemplates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody(input)),
    });
    const template = toTemplate(updated);
    templates.value = templates.value.map((item) => (item.id === id ? template : item));
    return template;
  }

  async function removeTemplate(id: string) {
    // Delete returns 204 with no body. apiData expects a `{ data }` envelope and
    // would throw after a successful delete.
    await apiRequest(`/api/v1/promptTemplates/${encodeURIComponent(id)}`, { method: 'DELETE' });
    templates.value = templates.value.filter((item) => item.id !== id);
