import { ref } from 'vue';

import {
  type ChatSession,
  createChatSession,
  deleteChatSession,
  listChatSessions,
  updateChatSession,
} from '../api/chatSessions';
import { FileRequestError } from '../api/fileRequest';

const sessions = ref<ChatSession[]>([]);
const loading = ref(false);
const loaded = ref(false);

/**
 * Shared chat-session list for the sidebar and chat routes.
 */
export function useChatSessions() {
  async function refresh() {
    loading.value = true;
    try {
      sessions.value = await listChatSessions();
      loaded.value = true;
    } finally {
      loading.value = false;
    }
  }

  async function create(title = '') {
    const created = await createChatSession(title);
    sessions.value = [created, ...sessions.value.filter((item) => item.id !== created.id)];
    return created;
  }

  async function rename(id: number, title: string) {
    const updated = await updateChatSession(id, title);
    sessions.value = sessions.value.map((item) => (item.id === id ? updated : item));
    return updated;
  }

  async function remove(id: number) {
    await deleteChatSession(id);
    sessions.value = sessions.value.filter((item) => item.id !== id);
  }

  async function ensureLoaded() {
    if (loaded.value || loading.value) return;
    try {
      await refresh();
    } catch (caught) {
      if (caught instanceof FileRequestError && caught.status === 401) return;
      throw caught;
    }
  }

  return {
    sessions,
    loading,
    loaded,
    refresh,
    create,
    rename,
    remove,
    ensureLoaded,
  };
}
