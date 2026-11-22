<script setup lang="ts">
import { toastError } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import ComposerConfigBlocks from '../components/ComposerConfigBlocks.vue';
import ComposerTrailingActions from '../components/ComposerTrailingActions.vue';
import { onComposerEnterSubmit } from '../composables/useComposerEnterSubmit';
import { useChatSessions } from '../composables/useChatSessions';

const { t, tm } = useI18n();
const router = useRouter();
const { create: createSession } = useChatSessions();
const message = ref('');
const composerConfig = ref<InstanceType<typeof ComposerConfigBlocks> | null>(null);
const starting = ref(false);
const suggestions = computed(() => tm('home.suggestions') as string[]);
const selectedWorkspaceId = computed(() => {
  const exposed = composerConfig.value?.workspaceId as
    string | null | { value?: string | null } | undefined;
  if (exposed == null) return null;
  if (typeof exposed === 'string') return exposed;
  return exposed.value ?? null;
});

async function startConversation(prompt = message.value) {
  const text = prompt.trim();
  if (!text || starting.value) return;
  starting.value = true;
  try {
    const session = await createSession();
    await router.push({
      name: 'chat-session',
      params: { sessionId: String(session.id) },
      query: { prompt: text },
    });
  } catch {
    toastError(t('chat.sessionCreateError'), t('toast.error'));
  } finally {
    starting.value = false;
  }
}

function onComposerKeydown(event: KeyboardEvent) {
  onComposerEnterSubmit(event, () => startConversation());
}
</script>

<template>
  <section
    class="relative isolate flex min-h-[calc(100vh-129px)] w-full min-w-0 max-w-full items-center justify-center overflow-hidden px-4 py-16 sm:px-6"
  >
    <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        class="absolute left-1/2 top-1/4 size-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl dark:bg-primary/10"
      />
      <div
        class="absolute -right-32 bottom-0 size-80 rounded-full bg-warning/20 blur-3xl dark:bg-warning/10"
      />
    </div>

    <div class="w-full text-center">
      <div
        class="mx-auto mb-7 size-28 overflow-hidden rounded-[2rem] border border-input/70 bg-accent shadow-2xl shadow-blue-500/10 sm:size-36"
      >
        <img
          src="/assets/logo-light.png"
          alt="AgentGo"
          class="size-full object-cover dark:hidden"
        />
        <img src="/assets/logo-dark.png" alt="" class="hidden size-full object-cover dark:block" />
      </div>
      <p class="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
        {{ t('home.eyebrow') }}
      </p>
      <h1 class="text-4xl font-semibold tracking-tight sm:text-6xl">{{ t('home.title') }}</h1>
      <p class="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
        {{ t('home.description') }}
      </p>

      <form
        class="mx-auto mt-10 rounded-2xl border border-input bg-card/90 p-2 text-left shadow-xl shadow-foreground/10 backdrop-blur transition-shadow duration-300 hover:shadow-2xl"
        @submit.prevent="startConversation()"
      >
        <label for="home-message" class="sr-only">{{ t('home.placeholder') }}</label>
        <textarea
          id="home-message"
          v-model="message"
          rows="3"
          :placeholder="t('home.placeholder')"
          class="block w-full resize-none border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
          @keydown="onComposerKeydown"
        />
        <div class="flex items-center gap-1.5 border-t border-input/70 px-1 pt-2">
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            <ComposerConfigBlocks ref="composerConfig" :disabled="starting" />
          </div>
          <div class="flex shrink-0 items-center gap-0.5">
            <ComposerTrailingActions
              v-model="message"
              :workspace-id="selectedWorkspaceId"
              :disabled="starting"
            />
            <button
              type="submit"
              class="ag-btn ag-btn-primary ag-btn-icon shrink-0"
              :aria-label="t('home.send')"
              :disabled="!message.trim()"
            >
              <Icon icon="lucide:arrow-up" width="18" height="18" aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>

      <div class="mt-5 flex flex-wrap justify-center gap-2">
        <button
          v-for="suggestion in suggestions"
          :key="suggestion"
          type="button"
          class="ag-chip rounded-full border border-input bg-card/70 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground"
          @click="startConversation(suggestion)"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>
  </section>
</template>
