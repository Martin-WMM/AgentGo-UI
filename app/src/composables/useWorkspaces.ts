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
    await apiRequest(`/api/v1/files/workspace?path=${encodeURIComponent(path)}`, { method: 'DELETE' });
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
