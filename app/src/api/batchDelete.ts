import { apiRequest } from './fileRequest';

/**
 * Deletes resources by numeric id. The backend treats the call as all-or-nothing.
 *
 * @param path batch-delete endpoint
 * @param ids selected resource identifiers
 */
export function batchDeleteIds(path: string, ids: string[]) {
  return apiRequest(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: ids.map((id) => Number(id)) }),
  });
}

/**
 * Deletes workspace files by relative path.
 *
 * @param paths selected workspace-relative paths
 */
export function batchDeletePaths(paths: string[]) {
  return apiRequest('/api/v1/files/workspace/batch-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths }),
  });
}
