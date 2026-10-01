<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t, tm } = useI18n();
const router = useRouter();
const message = ref('');
const suggestions = computed(() => tm('home.suggestions') as string[]);

function startConversation(prompt = message.value) {
  if (!prompt.trim()) return;
  router.push({ name: 'chat', query: { prompt: prompt.trim() } });
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
              class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              :aria-label="t('home.attach')"
            >
              <Icon icon="lucide:paperclip" width="18" height="18" aria-hidden="true" />
            </button>
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
