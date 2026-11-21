import { onBeforeUnmount, ref, watch, type Ref } from 'vue';

import { backendRequestHeaders } from '../api/locale';
import { backendBaseUrl } from '../stores/auth';

/**
 * Resolves an avatar URL for display.
 *
 * Public http(s) URLs and `data:` images are used directly. AgentGo avatar
 * downloads require the session cookie, so those URLs are fetched and shown
 * through a blob URL. Relative `/api/v1/files/avatar` paths, and previously
 * stored `/api/files/avatar` paths, are resolved against the backend origin
 * (not the Vite host) and fetched from `/api/v1/files/avatar`.
 *
 * @param source avatar URL, including the authenticated avatar endpoint
 * @returns a URL safe to bind to an image element
 */
export function useAuthenticatedImage(source: Ref<string | null | undefined>) {
  const displayUrl = ref<string | null>(null);
  let objectUrl: string | null = null;
  let requestId = 0;

  function revoke() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  }

  function resolveFetchUrl(url: string): string {
    const avatarPath = '/api/v1/files/avatar';
    if (url.startsWith('/api/files/avatar') || url.startsWith(avatarPath)) {
      return `${backendBaseUrl}${avatarPath}`;
    }
    if (url.includes('/api/files/avatar')) {
      return url.replace('/api/files/avatar', avatarPath);
    }
    return url;
  }

  watch(
    source,
    async (url) => {
      const current = ++requestId;
      revoke();
      displayUrl.value = null;
      const trimmed = url?.trim() ?? '';
      if (!trimmed) return;
      if (!trimmed.includes('/api/files/avatar') && !trimmed.includes('/api/v1/files/avatar')) {
        displayUrl.value = trimmed;
        return;
      }
      try {
        const response = await fetch(resolveFetchUrl(trimmed), {
          credentials: 'include',
          headers: backendRequestHeaders(),
        });
        if (!response.ok || current !== requestId) return;
        const blob = await response.blob();
        if (current !== requestId) return;
        objectUrl = URL.createObjectURL(blob);
        displayUrl.value = objectUrl;
      } catch {
        if (current === requestId) displayUrl.value = null;
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    requestId += 1;
    revoke();
  });

  return { displayUrl };
}
