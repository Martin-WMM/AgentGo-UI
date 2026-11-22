<script setup lang="ts">
import { toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import MarkdownRender from 'markstream-vue';
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import 'markstream-vue/index.css';

import {
  type AgentTurnVo,
  agentStreamFailureI18n,
  applyAgentStreamEvent,
  emptyAgentTurnVo,
  streamAgent,
} from '../api/agentStream';
import {
  type ChatSession,
  createChatSession,
  getChatSession,
  listChatMessages,
} from '../api/chatSessions';
import { parsePlanSteps } from '../agent/events';
import ChatMessageActions from '../components/ChatMessageActions.vue';
import ChatToolActivity from '../components/ChatToolActivity.vue';
import ComposerConfigBlocks from '../components/ComposerConfigBlocks.vue';
import ComposerTrailingActions from '../components/ComposerTrailingActions.vue';
import { onComposerEnterSubmit } from '../composables/useComposerEnterSubmit';
import { useChatSessions } from '../composables/useChatSessions';
import { useTheme } from '../composables/useTheme';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  turn: AgentTurnVo;
  /** performance.now() when the agent run started. */
  startedAt?: number;
  /** Milliseconds until the first streamed answer character. */
  ttftMs?: number | null;
  liked?: boolean | null;
  speaking?: boolean;
}

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { theme } = useTheme();
const { refresh: refreshSessions } = useChatSessions();
const draft = ref(typeof route.query.prompt === 'string' ? route.query.prompt : '');
const messages = ref<ChatMessage[]>([]);
const session = ref<ChatSession | null>(null);
const loadingSession = ref(false);
const streaming = ref(false);
const transcript = ref<HTMLElement | null>(null);
const composerConfig = ref<InstanceType<typeof ComposerConfigBlocks> | null>(null);
const selectedWorkspaceId = computed(() => {
  const exposed = composerConfig.value?.workspaceId as
    | string
    | null
    | { value?: string | null }
    | undefined;
  if (exposed == null) return null;
  if (typeof exposed === 'string') return exposed;
  return exposed.value ?? null;
});
const isDark = computed(() => theme.value === 'dark');
let abort: AbortController | null = null;
let bootToken = 0;
let activeSpeech: SpeechSynthesisUtterance | null = null;

const planStatusIcon: Record<string, string> = {
  preparing: 'lucide:circle',
  ready: 'lucide:circle',
  running: 'lucide:loader-circle',
  succeeded: 'lucide:check',
  skipped: 'lucide:skip-forward',
  failed: 'lucide:x',
};

async function scrollToEnd() {
  await nextTick();
  const pane = transcript.value;
  if (!pane || typeof pane.scrollTo !== 'function') return;
  pane.scrollTo({ top: pane.scrollHeight });
}

function assistantMessage(id: string): ChatMessage | undefined {
  return messages.value.find((item) => item.id === id);
}

function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  activeSpeech = null;
  for (const item of messages.value) {
    if (item.speaking) item.speaking = false;
  }
}

function stop() {
  abort?.abort();
  stopSpeech();
}

function onComposerKeydown(event: KeyboardEvent) {
  onComposerEnterSubmit(event, () => {
    void send();
  });
}

function historyToMessages(
  rows: Awaited<ReturnType<typeof listChatMessages>>,
): ChatMessage[] {
  return rows.map((row) => {
    if (row.role === 'assistant') {
      const planSteps = row.plan ? parsePlanSteps(row.plan).map((step) => ({
        ...step,
        status: 'succeeded' as const,
      })) : [];
      return {
        id: `history-${row.id}`,
        role: 'assistant',
        text: row.content,
        turn: {
          planPreparing: false,
          planSteps,
          toolActivities: [],
          answer: { content: row.content, final: true },
          final: true,
          failed: false,
        },
        ttftMs: null,
        liked: null,
        speaking: false,
      };
    }
    return {
      id: `history-${row.id}`,
      role: 'user',
      text: row.content,
      turn: emptyAgentTurnVo(),
    };
  });
}

async function bootstrapSession() {
  const token = ++bootToken;
  abort?.abort();
  stopSpeech();
  streaming.value = false;
  loadingSession.value = true;
  messages.value = [];
  session.value = null;
  try {
    const rawId = route.params.sessionId;
    if (!rawId) {
      const created = await createChatSession();
      if (token !== bootToken) return;
      await refreshSessions();
      await router.replace({
        name: 'chat-session',
        params: { sessionId: String(created.id) },
        query: route.query.prompt ? { prompt: route.query.prompt } : {},
      });
      return;
    }
    const id = Number(rawId);
    if (!Number.isFinite(id)) {
      await router.replace({ name: 'chat' });
      return;
    }
    const [detail, history] = await Promise.all([getChatSession(id), listChatMessages(id)]);
    if (token !== bootToken) return;
    session.value = detail;
    messages.value = historyToMessages(history);
    await refreshSessions();
    const prompt = typeof route.query.prompt === 'string' ? route.query.prompt.trim() : '';
    if (prompt) {
      draft.value = prompt;
      await router.replace({ name: 'chat-session', params: { sessionId: String(id) } });
      await send();
    }
  } catch {
    if (token !== bootToken) return;
    toastError(t('chat.loadError'), t('toast.error'));
    await router.replace({ name: 'chat' });
  } finally {
    if (token === bootToken) loadingSession.value = false;
  }
}

function markFirstToken(assistant: ChatMessage) {
  if (assistant.ttftMs != null || assistant.startedAt == null) return;
  if (!assistant.turn.answer.content) return;
  assistant.ttftMs = Math.max(0, performance.now() - assistant.startedAt);
}

async function send(overrideInput?: string, options?: { skipUserBubble?: boolean }) {
  const input = (overrideInput ?? draft.value).trim();
  const current = session.value;
  if (!input || streaming.value || !current) return;
  if (overrideInput == null) draft.value = '';
  stopSpeech();
  const startedAt = performance.now();
  const assistantId = crypto.randomUUID();
  if (!options?.skipUserBubble) {
    messages.value.push({
      id: crypto.randomUUID(),
      role: 'user',
      text: input,
      turn: emptyAgentTurnVo(),
    });
  }
  messages.value.push({
    id: assistantId,
    role: 'assistant',
    text: '',
    turn: emptyAgentTurnVo(),
    startedAt,
    ttftMs: null,
    liked: null,
    speaking: false,
  });
  streaming.value = true;
  abort = new AbortController();
  const signal = abort.signal;
  await scrollToEnd();
  try {
    await streamAgent({
      threadId: current.threadId,
      sessionId: current.id,
      input,
      bindings: composerConfig.value?.toStreamMetadata() ?? {},
      signal,
      onEvent: (envelope) => {
        const assistant = assistantMessage(assistantId);
        if (!assistant) return;
        assistant.turn = applyAgentStreamEvent(assistant.turn, envelope);
        markFirstToken(assistant);
        void scrollToEnd();
      },
    });
    const assistant = assistantMessage(assistantId);
    if (assistant && !assistant.turn.final) {
      assistant.turn = {
        ...assistant.turn,
        final: true,
        answer: { ...assistant.turn.answer, final: true },
      };
    }
    if (assistant) markFirstToken(assistant);
    void refreshSessions();
  } catch (caught) {
    const assistant = assistantMessage(assistantId);
    if (signal.aborted) {
      if (assistant) {
        assistant.turn = {
          ...assistant.turn,
          final: true,
          answer: { ...assistant.turn.answer, final: true },
        };
        markFirstToken(assistant);
      }
      return;
    }
    const key = agentStreamFailureI18n(caught);
    toastError(t(key), t('toast.error'));
    if (assistant) {
      assistant.turn = {
        ...assistant.turn,
        final: true,
        failed: true,
        answer: {
          content: assistant.turn.answer.content || t(key),
          final: true,
        },
      };
      markFirstToken(assistant);
    }
  } finally {
    streaming.value = false;
    abort = null;
    await scrollToEnd();
  }
}

function answerText(item: ChatMessage): string {
  return item.turn.answer.content || item.text || '';
}

async function copyAnswer(item: ChatMessage) {
  const text = answerText(item).trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toastSuccess(t('chat.actions.copied'));
  } catch {
