/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createChatSession,
  ensureChatSession,
  listChatMessages,
  listChatSessions,
} from '../src/api/chatSessions';

describe('chatSessions api helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('lists sessions from the data envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ id: 1, title: 'A', threadId: 't', createdAt: '', updatedAt: '' }],
        }),
      }),
    );
    await expect(listChatSessions()).resolves.toEqual([
      { id: 1, title: 'A', threadId: 't', createdAt: '', updatedAt: '' },
    ]);
  });

  it('creates a session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: { id: 2, title: 'New conversation', threadId: 'u', createdAt: '', updatedAt: '' },
        }),
      }),
    );
    await expect(createChatSession()).resolves.toMatchObject({ id: 2, threadId: 'u' });
  });

  it('ensures a session by creating when the list is empty', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: { id: 9, title: 'New conversation', threadId: 'x', createdAt: '', updatedAt: '' },
        }),
      });
    vi.stubGlobal('fetch', fetchMock);
    await expect(ensureChatSession()).resolves.toMatchObject({ id: 9 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('lists messages for a session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ id: 1, sessionId: 3, role: 'user', content: 'hi', createdAt: '' }],
        }),
      }),
    );
    await expect(listChatMessages(3)).resolves.toEqual([
      { id: 1, sessionId: 3, role: 'user', content: 'hi', createdAt: '' },
    ]);
  });
});
