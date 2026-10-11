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
