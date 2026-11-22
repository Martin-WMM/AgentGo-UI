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
    toastError(t('chat.invalid'), t('toast.error'));
  }
}

function speakAnswer(item: ChatMessage) {
  if (item.speaking) {
    stopSpeech();
    return;
  }
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    toastError(t('chat.actions.speakUnsupported'), t('toast.error'));
    return;
  }
  const text = answerText(item)
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$]+\$/g, ' ')
    .replace(/[`*_#>[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return;
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.onend = () => {
    item.speaking = false;
    if (activeSpeech === utterance) activeSpeech = null;
  };
  utterance.onerror = () => {
    item.speaking = false;
    if (activeSpeech === utterance) activeSpeech = null;
  };
  activeSpeech = utterance;
  item.speaking = true;
  window.speechSynthesis.speak(utterance);
}

function previousUserText(assistantId: string): string {
  const index = messages.value.findIndex((item) => item.id === assistantId);
  if (index <= 0) return '';
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const item = messages.value[cursor];
    if (item?.role === 'user') return item.text;
  }
  return '';
}

async function regenerate(item: ChatMessage) {
  if (streaming.value) return;
  const prompt = previousUserText(item.id);
  if (!prompt) return;
  const index = messages.value.findIndex((row) => row.id === item.id);
  if (index >= 0) {
    messages.value.splice(index, 1);
  }
  await send(prompt, { skipUserBubble: true });
}

function setLiked(item: ChatMessage, value: boolean) {
  item.liked = item.liked === value ? null : value;
}

watch(
  () => route.params.sessionId,
  () => {
    void bootstrapSession();
  },
  { immediate: true },
);

onUnmounted(() => {
  bootToken += 1;
  abort?.abort();
  stopSpeech();
});
</script>

<template>
  <section class="ag-page ag-page--tight flex min-h-[70vh] flex-col">
    <div
      v-if="loadingSession && messages.length === 0"
      class="flex flex-1 items-center justify-center text-sm text-muted-foreground"
    >
      {{ t('chat.loading') }}
    </div>
    <div
      v-else-if="messages.length === 0"
      class="flex flex-1 flex-col items-center justify-center text-center"
    >
      <div
        class="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/10"
      >
        <Icon icon="lucide:sparkles" width="26" height="26" aria-hidden="true" />
      </div>
      <h1 class="text-2xl font-semibold tracking-tight">
        {{ session?.title || t('chat.title') }}
      </h1>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('chat.description') }}</p>
    </div>
    <div
      v-else
      ref="transcript"
      class="flex max-h-[70vh] flex-1 flex-col gap-5 overflow-y-auto pb-4"
      :aria-label="t('chat.title')"
    >
      <article
        v-for="item in messages"
        :key="item.id"
        class="flex flex-col"
        :class="item.role === 'user' ? 'items-end' : 'items-start'"
      >
        <p class="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon
            :icon="item.role === 'user' ? 'lucide:user' : 'lucide:bot'"
            width="14"
            height="14"
            aria-hidden="true"
          />
          {{ item.role === 'user' ? t('chat.you') : t('chat.assistant') }}
        </p>
        <div
          v-if="item.role === 'user'"
          class="max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-sm whitespace-pre-wrap text-primary-foreground"
        >
          {{ item.text }}
        </div>
        <div v-else class="w-full max-w-3xl space-y-3">
          <div
            v-if="item.turn.planPreparing || item.turn.planSteps.length"
            class="rounded-xl border border-input/80 bg-muted/40 px-4 py-3"
          >
            <p class="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Icon icon="lucide:list-checks" width="14" height="14" aria-hidden="true" />
              {{ t('chat.plan') }}
            </p>
            <p v-if="item.turn.planPreparing && !item.turn.planSteps.length" class="text-sm text-muted-foreground">
              {{ t('chat.planPreparing') }}
            </p>
            <ol v-else class="space-y-2">
              <li
                v-for="step in item.turn.planSteps"
                :key="step.id"
                class="flex items-start gap-2 text-sm"
              >
                <Icon
                  :icon="planStatusIcon[step.status] || 'lucide:circle'"
                  width="16"
                  height="16"
                  class="mt-0.5 shrink-0"
                  :class="{
                    'animate-spin text-primary': step.status === 'running',
                    'text-muted-foreground': step.status === 'ready' || step.status === 'preparing',
                    'text-emerald-600 dark:text-emerald-400': step.status === 'succeeded',
                    'text-destructive': step.status === 'failed',
                  }"
                  aria-hidden="true"
                />
                <span class="min-w-0 flex-1">
                  <span class="sr-only">{{ t(`chat.planStatus.${step.status}`) }}</span>
                  {{ step.text }}
                </span>
              </li>
            </ol>
          </div>
          <ChatToolActivity :activities="item.turn.toolActivities" />
          <div v-if="item.turn.answer.content" class="rounded-2xl border border-input bg-card px-4 py-3">
            <MarkdownRender
              mode="chat"
              :content="item.turn.answer.content"
              :final="item.turn.answer.final || item.turn.final"
              :is-dark="isDark"
              smooth-streaming
            />
          </div>
          <p
            v-else-if="!item.turn.final && !item.turn.toolActivities.length"
            class="text-sm text-muted-foreground"
          >
            {{ t('chat.streaming') }}
          </p>
          <p
            v-else-if="!item.turn.final && item.turn.toolActivities.some((activity) => activity.status === 'running' || activity.status === 'started')"
            class="text-sm text-muted-foreground"
          >
            {{ t('chat.toolActivity.working') }}
          </p>
          <ChatMessageActions
            v-if="item.turn.final || item.turn.answer.content"
            :ttft-ms="item.ttftMs"
            :liked="item.liked"
            :speaking="item.speaking"
            :disabled="streaming && !item.turn.final"
            @copy="copyAnswer(item)"
            @speak="speakAnswer(item)"
            @refresh="regenerate(item)"
            @like="setLiked(item, true)"
            @dislike="setLiked(item, false)"
          />
        </div>
      </article>
    </div>
    <form
      class="sticky bottom-0 rounded-2xl border border-input bg-card/95 p-2 shadow-lg shadow-foreground/10 backdrop-blur"
      @submit.prevent="send()"
    >
      <label for="chat-message" class="sr-only">{{ t('home.placeholder') }}</label>
      <textarea
        id="chat-message"
        v-model="draft"
        rows="3"
        :placeholder="t('home.placeholder')"
        class="block w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
        @keydown="onComposerKeydown"
      />
      <div class="flex items-center gap-1.5 border-t border-input/70 pt-2">
        <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          <ComposerConfigBlocks ref="composerConfig" :disabled="streaming" />
        </div>
        <span v-if="streaming" class="shrink-0 px-2 text-xs text-muted-foreground">{{
          t('chat.streaming')
        }}</span>
        <div class="flex shrink-0 items-center gap-0.5">
          <ComposerTrailingActions
            v-model="draft"
            :workspace-id="selectedWorkspaceId"
            :disabled="streaming || loadingSession"
          />
          <button
            v-if="streaming"
            type="button"
            class="ag-btn ag-btn-primary ag-btn-icon shrink-0"
            :aria-label="t('chat.stop')"
            @click="stop"
          >
            <Icon icon="lucide:square" width="16" height="16" aria-hidden="true" />
          </button>
          <button
            v-else
            type="submit"
            class="ag-btn ag-btn-primary ag-btn-icon shrink-0"
            :aria-label="t('home.send')"
            :disabled="!draft.trim() || !session || loadingSession"
          >
            <Icon icon="lucide:arrow-up" width="18" height="18" aria-hidden="true" />
          </button>
        </div>
      </div>
    </form>
  </section>
</template>
