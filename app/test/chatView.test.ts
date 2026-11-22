// @vitest-environment jsdom

import { createApp, nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChatView from '../src/views/ChatView.vue';
import { i18n } from '../src/i18n';

const streamAgent = vi.fn();
const getChatSession = vi.fn();
const listChatMessages = vi.fn();
const createChatSession = vi.fn();
const refreshSessions = vi.fn();

vi.mock('../src/api/agentStream', async () => {
  const actual = await vi.importActual<typeof import('../src/api/agentStream')>(
    '../src/api/agentStream',
  );
  return {
    ...actual,
    streamAgent: (...args: unknown[]) => streamAgent(...args),
  };
});

vi.mock('../src/api/chatSessions', () => ({
  getChatSession: (...args: unknown[]) => getChatSession(...args),
  listChatMessages: (...args: unknown[]) => listChatMessages(...args),
  createChatSession: (...args: unknown[]) => createChatSession(...args),
}));

vi.mock('../src/composables/useChatSessions', () => ({
  useChatSessions: () => ({
    sessions: { value: [] },
    loading: { value: false },
    loaded: { value: true },
    refresh: (...args: unknown[]) => refreshSessions(...args),
    create: vi.fn(),
    rename: vi.fn(),
    remove: vi.fn(),
    ensureLoaded: vi.fn(),
  }),
}));

vi.mock('@agentgo/ui', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

function installMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
}

async function mountChat(sessionId = '7'): Promise<HTMLElement> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/chat', name: 'chat', component: ChatView },
      { path: '/chat/:sessionId', name: 'chat-session', component: ChatView },
    ],
  });
  await router.push({ name: 'chat-session', params: { sessionId } });
  await router.isReady();
  const host = document.createElement('div');
  document.body.append(host);
  createApp(ChatView).use(i18n).use(router).mount(host);
  await vi.waitFor(() => {
    expect(host.querySelector('#chat-message')).not.toBeNull();
  });
  return host;
}

describe('ChatView agent stream', () => {
  beforeEach(() => {
    installMatchMedia();
    document.body.innerHTML = '';
    streamAgent.mockReset();
    refreshSessions.mockReset().mockResolvedValue(undefined);
    getChatSession.mockReset().mockResolvedValue({
      id: 7,
      title: 'New conversation',
      threadId: '11111111-1111-1111-1111-111111111111',
      createdAt: '',
      updatedAt: '',
    });
    listChatMessages.mockReset().mockResolvedValue([]);
    createChatSession.mockReset();
  });

  it('sends the composer text and renders the plan and answer through the stream', async () => {
    streamAgent.mockImplementation(async (request: {
      input: string;
      threadId: string;
      sessionId?: number;
      onEvent: (envelope: unknown) => void;
    }) => {
      request.onEvent({
        eventId: '1',
        data: {
          kind: 'message',
          phase: 'ASSISTANT',
          threadId: request.threadId,
          nodeId: 'plan',
          content: '1. Add the numbers.',
        },
      });
      request.onEvent({
        eventId: '1a',
        data: {
          kind: 'cli.lifecycle',
          phase: 'STARTED',
          threadId: request.threadId,
          toolName: 'bash',
          content: 'echo ok',
        },
      });
      request.onEvent({
        eventId: '1b',
        data: {
          kind: 'cli.lifecycle',
          phase: 'SUCCEEDED',
          threadId: request.threadId,
          toolName: 'bash',
          content: 'status=COMPLETED exitCode=0\nstdout:\nok',
        },
      });
      request.onEvent({
        eventId: '2',
        data: {
          kind: 'node.lifecycle',
          phase: 'COMPLETED',
          threadId: request.threadId,
          nodeId: 'output',
          content: 'The answer is **2**.',
        },
      });
      request.onEvent({
        eventId: '3',
        finished: true,
        data: {
          kind: 'agent.lifecycle',
          phase: 'COMPLETED',
