<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRouter } from 'vue-router';

import { useWorkspaces } from '../composables/useWorkspaces';

const { t, tm } = useI18n();
const router = useRouter();
const { workspaces, createWorkspace, uploadFile } = useWorkspaces();
const message = ref('');
const attachInput = ref<HTMLInputElement | null>(null);
const attaching = ref(false);
const attachNotice = ref<string | null>(null);
const attachFailed = ref(false);
const suggestions = computed(() => tm('home.suggestions') as string[]);

function startConversation(prompt = message.value) {
  if (!prompt.trim()) return;
  router.push({ name: 'chat', query: { prompt: prompt.trim() } });
}

function openAttachPicker() {
  if (attaching.value) return;
  attachNotice.value = null;
  attachInput.value?.click();
}

function ensureUploadsWorkspace() {
  const existing = workspaces.value.find(
    (workspace) => workspace.name === t('home.uploadsWorkspace'),
  );
  if (existing) return existing;
  return createWorkspace(t('home.uploadsWorkspace'), t('home.uploadsWorkspaceDescription'));
}

async function onAttachChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  attaching.value = true;
  attachNotice.value = null;
  attachFailed.value = false;
  try {
    const workspace = ensureUploadsWorkspace();
    await uploadFile(workspace.id, file);
    attachNotice.value = t('home.attachSuccess', { name: file.name });
  } catch {
    attachFailed.value = true;
    attachNotice.value = t('home.attachError');
  } finally {
    attaching.value = false;
  }
}
</script>

<template>
  <section
    class="relative isolate flex min-h-[calc(100vh-129px)] items-center justify-center overflow-hidden px-4 py-16 sm:px-6"
  >
    <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        class="absolute left-1/2 top-1/4 size-[28rem] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-400/5"
      />
      <div
        class="absolute -right-32 bottom-0 size-80 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/5"
      />
    </div>

    <div class="w-full max-w-3xl text-center">
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
        class="mx-auto mt-10 rounded-2xl border border-input bg-background/90 p-2 text-left shadow-xl shadow-slate-900/5 backdrop-blur"
        @submit.prevent="startConversation()"
      >
        <label for="home-message" class="sr-only">{{ t('home.placeholder') }}</label>
        <textarea
          id="home-message"
          v-model="message"
          rows="3"
          :placeholder="t('home.placeholder')"
          class="block w-full resize-none border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
        />
        <div class="flex items-center justify-between gap-2 border-t border-input/70 px-1 pt-2">
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
              :aria-label="attaching ? t('home.attaching') : t('home.attach')"
              :disabled="attaching"
              @click="openAttachPicker"
            >
              <Icon
                :icon="attaching ? 'lucide:loader-circle' : 'lucide:paperclip'"
                width="18"
                height="18"
                aria-hidden="true"
                :class="attaching ? 'animate-spin' : undefined"
              />
            </button>
            <input ref="attachInput" type="file" class="sr-only" @change="onAttachChange" />
            <button
              type="button"
              class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              :aria-label="t('home.voice')"
            >
              <Icon icon="lucide:mic" width="18" height="18" aria-hidden="true" />
            </button>
          </div>
          <button
            type="submit"
            class="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            :aria-label="t('home.send')"
            :disabled="!message.trim()"
          >
            <Icon icon="lucide:arrow-up" width="18" height="18" aria-hidden="true" />
          </button>
        </div>
      </form>

      <p
        v-if="attachNotice"
        class="mx-auto mt-3 max-w-xl text-sm"
        :class="attachFailed ? 'text-destructive' : 'text-muted-foreground'"
        role="status"
      >
        {{ attachNotice }}
        <RouterLink
          v-if="!attachFailed"
          to="/console/files"
          class="ml-1 font-medium text-foreground underline-offset-4 hover:underline"
        >
          {{ t('console.items.files') }}
        </RouterLink>
      </p>

      <div class="mt-5 flex flex-wrap justify-center gap-2">
        <button
          v-for="suggestion in suggestions"
          :key="suggestion"
          type="button"
          class="rounded-full border border-input bg-background/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
          @click="startConversation(suggestion)"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>
  </section>
</template>
