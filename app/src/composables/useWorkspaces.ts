import { computed, ref } from 'vue';

import { apiRequest } from '../api/fileRequest';
import { backendBaseUrl } from '../stores/auth';

export interface Workspace {
  id: string;
  name: string;
  description: string;
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

const storageKey = 'agentgo-workspaces';
const workspaces = ref<Workspace[]>(readWorkspaces());

function readWorkspaces(): Workspace[] {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? (JSON.parse(saved) as Workspace[]) : [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(workspaces.value));
}

function createId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function workspacePath(workspaceId: string, filename: string) {
  return `${workspaceId}/${filename.replace(/^[/\\]+/, '')}`;
}

function fileName(path: string) {
  return path.split('/').at(-1) || path;
}

export { FileRequestError, uploadFailureI18n } from '../api/fileRequest';

export function useWorkspaces() {
  const sortedWorkspaces = computed(() =>
    [...workspaces.value].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

  function createWorkspace(name: string, description: string) {
    const workspace: Workspace = {
      id: createId(),
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
    };
    workspaces.value.push(workspace);
    persist();
    return workspace;
  }

  function updateWorkspace(id: string, name: string, description: string) {
    const workspace = workspaces.value.find((item) => item.id === id);
    if (!workspace) return;
    workspace.name = name.trim();
    workspace.description = description.trim();
    persist();
  }

  function removeWorkspace(id: string) {
    workspaces.value = workspaces.value.filter((item) => item.id !== id);
    persist();
  }

  function getWorkspace(id: string) {
    return workspaces.value.find((item) => item.id === id);
  }

  async function listFiles(workspaceId: string): Promise<WorkspaceFile[]> {
    const response = await apiRequest<{ data: ListedFile[] }>('/api/files/workspace/files');
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
    await apiRequest(`/api/files/workspace?path=${encodeURIComponent(path)}`, {
      method: 'PUT',
      body,
    });
  }

  async function deleteFile(path: string) {
    await apiRequest(`/api/files/workspace?path=${encodeURIComponent(path)}`, { method: 'DELETE' });
  }

  function downloadFile(path: string) {
    window.open(`${backendBaseUrl}/api/files/workspace?path=${encodeURIComponent(path)}`, '_blank');
  }

  return {
    workspaces: sortedWorkspaces,
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
