import { computed, ref } from 'vue';

import { apiData, apiRequest } from '../api/fileRequest';
import { backendRequestHeaders } from '../api/locale';
import { normalizeWorkspaceColor } from '../lib/workspaceColors';
import { backendBaseUrl } from '../stores/auth';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
}

export interface WorkspaceFile {
  path: string;
  name: string;
  sizeBytes: number;
  contentType: string;
  updatedAt: string;
  downloadUrl: string;
}

interface ListedFile {
  objectKey: string;
  sizeBytes: number;
  contentType: string;
  updatedAt: string;
  downloadUrl: string;
}

interface WorkspaceDto {
  id: string;
  name: string;
  description?: string | null;
  metadata?: { color?: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

const workspaces = ref<Workspace[]>([]);
const loaded = ref(false);
let loading: Promise<void> | null = null;

function toWorkspace(dto: WorkspaceDto): Workspace {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description?.trim() ?? '',
    color: normalizeWorkspaceColor(dto.metadata?.color),
    createdAt: dto.createdAt,
  };
}

function workspacePath(workspaceId: string, filename: string) {
  return `${workspaceId}/${filename.replace(/^[/\\]+/, '')}`;
}

function fileName(path: string) {
  return path.split('/').at(-1) || path;
}

export { FileRequestError, uploadFailureI18n, workspaceFailureI18n } from '../api/fileRequest';

export function useWorkspaces() {
  const sortedWorkspaces = computed(() =>
    [...workspaces.value].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

  async function ensureLoaded() {
    if (loaded.value) return;
    if (!loading) {
      loading = (async () => {
        const data = await apiData<WorkspaceDto[]>('/api/v1/workspaces');
        workspaces.value = data.map(toWorkspace);
        loaded.value = true;
      })().finally(() => {
        loading = null;
      });
    }
    await loading;
  }

  async function refreshWorkspaces() {
    const data = await apiData<WorkspaceDto[]>('/api/v1/workspaces');
    workspaces.value = data.map(toWorkspace);
    loaded.value = true;
  }

  async function createWorkspace(name: string, description: string, color: string) {
    const created = await apiData<WorkspaceDto>('/api/v1/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        metadata: { color: normalizeWorkspaceColor(color) },
      }),
    });
    const workspace = toWorkspace(created);
    workspaces.value = [workspace, ...workspaces.value.filter((item) => item.id !== workspace.id)];
    loaded.value = true;
    return workspace;
  }

  async function updateWorkspace(id: string, name: string, description: string, color: string) {
    const updated = await apiData<WorkspaceDto>(`/api/v1/workspaces/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        metadata: { color: normalizeWorkspaceColor(color) },
      }),
    });
    const workspace = toWorkspace(updated);
    workspaces.value = workspaces.value.map((item) => (item.id === id ? workspace : item));
  }

  async function removeWorkspace(id: string) {
    await apiRequest(`/api/v1/workspaces/${encodeURIComponent(id)}`, { method: 'DELETE' });
    workspaces.value = workspaces.value.filter((item) => item.id !== id);
  }

  function getWorkspace(id: string) {
    return workspaces.value.find((item) => item.id === id);
  }

  async function listFiles(workspaceId: string): Promise<WorkspaceFile[]> {
    const response = await apiRequest<{ data: ListedFile[] }>('/api/v1/files/workspace/files');
    const prefix = `${workspaceId}/`;
    return response.data
      .map((file) => {
        const path = file.objectKey.split('/').slice(-2).join('/');
        return { ...file, path, name: fileName(path) };
      })
      .filter((file) => file.path.startsWith(prefix));
  }

  async function uploadFile(workspaceId: string, file: File) {
    const path = workspacePath(workspaceId, file.name);
    const body = new FormData();
    body.append('file', file);
    await apiRequest(`/api/v1/files/workspace?path=${encodeURIComponent(path)}`, {
      method: 'PUT',
      body,
    });
  }

  async function deleteFile(path: string) {
    await apiRequest(`/api/v1/files/workspace?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });
  }

  async function downloadFile(path: string) {
    const response = await fetch(
      `${backendBaseUrl}/api/v1/files/workspace?path=${encodeURIComponent(path)}`,
      {
        credentials: 'include',
        headers: backendRequestHeaders(),
      },
    );
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const filename = fileName(path);
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }

  void ensureLoaded().catch(() => {
    // Keep the console usable; views surface load errors on explicit actions.
  });

  return {
    workspaces: sortedWorkspaces,
    ensureLoaded,
    refreshWorkspaces,
    createWorkspace,
    updateWorkspace,
    removeWorkspace,
    getWorkspace,
    listFiles,
    uploadFile,
    deleteFile,
    downloadFile,
  };
}
