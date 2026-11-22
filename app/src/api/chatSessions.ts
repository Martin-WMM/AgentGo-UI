import { apiData, apiRequest } from './fileRequest';

/** Chat session returned by `/api/v1/chatSessions`. */
export interface ChatSession {
  id: number;
  title: string;
  threadId: string;
  createdAt: string;
  updatedAt: string;
}

/** Persisted chat message returned by `/api/v1/chatSessions/{id}/messages`. */
export interface ChatMessage {
  id: number;
  sessionId: number;
  role: 'user' | 'assistant' | 'system' | string;
  content: string;
  plan?: string | null;
  createdAt: string;
}

const BASE = '/api/v1/chatSessions';

/** Lists the authenticated user's chat sessions, newest first. */
export function listChatSessions(): Promise<ChatSession[]> {
  return apiData<ChatSession[]>(BASE);
}

/** Creates a chat session. Blank title becomes the backend default. */
export function createChatSession(title = ''): Promise<ChatSession> {
  return apiData<ChatSession>(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
}

/** Loads one chat session owned by the caller. */
export function getChatSession(id: number): Promise<ChatSession> {
  return apiData<ChatSession>(`${BASE}/${id}`);
}

/** Renames a chat session. */
export function updateChatSession(id: number, title: string): Promise<ChatSession> {
  return apiData<ChatSession>(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
}

/** Deletes a chat session and its messages. */
export function deleteChatSession(id: number): Promise<void> {
  return apiRequest(`${BASE}/${id}`, { method: 'DELETE' });
}

/** Lists chronological messages for a session. */
export function listChatMessages(id: number): Promise<ChatMessage[]> {
  return apiData<ChatMessage[]>(`${BASE}/${id}/messages`);
}

/**
 * Ensures at least one session exists and returns it.
 * Creates a default session when the list is empty.
 */
export async function ensureChatSession(): Promise<ChatSession> {
  const sessions = await listChatSessions();
  if (sessions.length > 0) return sessions[0]!;
  return createChatSession();
}
