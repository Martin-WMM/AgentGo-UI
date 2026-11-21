import { computed, ref } from 'vue';

import { isResourceIcon, type ResourceIconValue } from '@agentgo/ui';

import { batchDeleteIds } from '../api/batchDelete';
import { FileRequestError, apiData, apiRequest } from '../api/fileRequest';
import { DEFAULT_WORKSPACE_COLOR, normalizeWorkspaceColor } from '../lib/workspaceColors';

export type PromptEngine = 'SIMPLE' | 'JINJA2';

export interface PromptTemplate {
  id: string;
  groupName: string;
  name: string;
  version: string;
  revision: number;
  engine: PromptEngine;
  content: string;
  description: string;
  tags: string[];
  color: string;
  icon: ResourceIconValue | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromptTemplateInput {
  groupName: string;
  name: string;
  engine: PromptEngine;
  content: string;
  description: string;
  message: string;
  tags: string[];
  color: string;
  icon: ResourceIconValue | null;
}

export interface PromptRevision {
  id: string;
  templateId: string;
  groupName: string;
  name: string;
  version: string;
  revision: number;
  parentRevision: number | null;
  message: string;
  author: string;
  diff: string;
  createdAt: string;
}

interface PromptTemplateDto {
  id: string;
  groupName?: string;
  name: string;
  version?: string;
  revision?: number;
  engine: PromptEngine;
  content: string;
  description?: string | null;
  tags?: string[] | null;
  metadata?: {
    color?: string | null;
    icon?: { source?: string | null; value?: string | null } | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface PromptRevisionDto {
  id: string;
  templateId: string;
  groupName?: string;
  name?: string;
  version: string;
  revision: number;
  parentRevision?: number | null;
  message: string;
  author: string;
  diff: string;
  createdAt: string;
}

interface PromptRevisionPageDto {
  data: PromptRevisionDto[];
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

function toIcon(dto: PromptTemplateDto): ResourceIconValue | null {
  const source = dto.metadata?.icon?.source;
  const value = dto.metadata?.icon?.value?.trim() ?? '';
  if (source === 'ICONIFY' || source === 'URL') {
    const icon: ResourceIconValue = { source, value };
    return isResourceIcon(icon) ? icon : null;
  }
  return null;
}

function toTemplate(dto: PromptTemplateDto): PromptTemplate {
  return {
    id: String(dto.id),
    groupName: dto.groupName?.trim() ?? '',
    name: dto.name,
    version: dto.version?.trim() || 'latest',
    revision: dto.revision ?? 1,
    engine: dto.engine,
    content: dto.content,
    description: dto.description?.trim() ?? '',
    tags: (dto.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
    color: normalizeWorkspaceColor(dto.metadata?.color),
    icon: toIcon(dto),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function requestBody(input: PromptTemplateInput) {
  return {
    groupName: input.groupName.trim(),
    name: input.name.trim(),
    engine: input.engine,
    content: input.content,
    description: input.description.trim() || null,
    message: input.message.trim() || null,
    tags: input.tags,
    metadata: {
      color: normalizeWorkspaceColor(input.color || DEFAULT_WORKSPACE_COLOR),
      icon: input.icon,
    },
  };
}

/** Saves the template body as a Markdown file named from its group and name. */
export function downloadPromptTemplate(
  template: Pick<PromptTemplate, 'groupName' | 'name' | 'content'>,
) {
  const blob = new Blob([template.content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const raw = [template.groupName, template.name]
    .map((part) => part.trim())
    .filter(Boolean)
    .join('-');
  const filename = raw
    .replace(/[\\/:*?"<>|\s]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  anchor.href = url;
  anchor.download = `${filename || 'prompt'}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
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
  }

  async function removeTemplates(ids: string[]) {
    await batchDeleteIds('/api/v1/promptTemplates/batch-delete', ids);
    const removed = new Set(ids);
    templates.value = templates.value.filter((item) => !removed.has(item.id));
  }

  function toRevision(revision: PromptRevisionDto): PromptRevision {
    return {
      id: String(revision.id),
      templateId: String(revision.templateId),
      groupName: revision.groupName?.trim() ?? '',
      name: revision.name?.trim() ?? '',
      version: revision.version,
      revision: revision.revision,
      parentRevision: revision.parentRevision ?? null,
      message: revision.message,
      author: revision.author,
      diff: revision.diff,
      createdAt: revision.createdAt,
    };
  }

  async function listRevisions(id: string) {
    const data = await apiData<PromptRevisionPageDto>(
      `/api/v1/promptTemplates/${encodeURIComponent(id)}/revisions?page=1&size=100`,
    );
    return data.data.map(toRevision);
  }

  async function loadRevisionHistory() {
    const rows: PromptTemplate[] = [];
    let nextPage = 1;
    let pages = 1;
    while (nextPage <= pages && nextPage <= 5) {
      const params = new URLSearchParams({
        page: String(nextPage),
        size: '100',
        sort: 'updatedAt',
        order: 'DESC',
      });
      const data = await apiData<PromptTemplatePageDto | PromptTemplateDto[]>(
        `/api/v1/promptTemplates?${params.toString()}`,
      );
      if (Array.isArray(data)) {
        rows.push(...data.map(toTemplate));
        break;
      }
      rows.push(...data.data.map(toTemplate));
      pages = data.totalPages;
      nextPage += 1;
    }
    const groups = await Promise.all(rows.map((template) => listRevisions(template.id)));
    return groups.flat().sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async function previewTemplate(
    engine: PromptEngine,
    content: string,
    variables: Record<string, unknown>,
  ) {
    const rendered = await apiData<{ output: string }>('/api/v1/promptTemplates/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engine, content, variables }),
    });
    return rendered.output;
  }

  async function renderTemplate(id: string, variables: Record<string, unknown>) {
    const rendered = await apiData<{ output: string }>(`/api/v1/promptTemplates/${id}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables }),
    });
    return rendered.output;
  }

  return {
    templates: sortedTemplates,
    loaded,
    page,
    pageSize,
    totalElements,
    totalPages,
    first,
    last,
    refreshTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    removeTemplate,
    removeTemplates,
    listRevisions,
    loadRevisionHistory,
    previewTemplate,
    renderTemplate,
  };
}
