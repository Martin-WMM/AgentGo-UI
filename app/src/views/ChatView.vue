<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const { t } = useI18n();
const route = useRoute();
const message = ref(typeof route.query.prompt === 'string' ? route.query.prompt : '');
</script>

<template>
  <section class="ag-page ag-page--tight flex flex-col">
    <div class="flex flex-1 flex-col items-center justify-center text-center">
      <div
        class="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/10"
      >
        <Icon icon="lucide:sparkles" width="26" height="26" aria-hidden="true" />
      </div>
      <h1 class="text-2xl font-semibold tracking-tight">{{ t('chat.title') }}</h1>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('chat.description') }}</p>
    </div>
    <form
      class="rounded-2xl border border-input bg-card/90 p-2 shadow-lg shadow-foreground/10 transition-shadow duration-300 hover:shadow-xl"
      @submit.prevent
    >
      <label for="chat-message" class="sr-only">{{ t('home.placeholder') }}</label>
      <textarea
        id="chat-message"
        v-model="message"
        rows="3"
        :placeholder="t('home.placeholder')"
        class="block w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
      />
      <div class="flex justify-end border-t border-input/70 pt-2">
        <button
          type="submit"
          class="ag-btn ag-btn-primary ag-btn-icon"
          :aria-label="t('home.send')"
        >
          <Icon icon="lucide:arrow-up" width="18" height="18" aria-hidden="true" />
        </button>
      </div>
    </form>
  </section>
</template>
