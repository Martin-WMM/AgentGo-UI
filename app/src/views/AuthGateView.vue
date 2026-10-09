<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import { useAuthStore } from '../stores/auth';

const { t } = useI18n();
const route = useRoute();
const auth = useAuthStore();

const isAuthError = computed(() => route.name === 'auth-error' || 'authError' in route.query);
const title = computed(() =>
  isAuthError.value ? t('auth.gate.errorTitle') : t('auth.gate.signedOutTitle'),
);
const description = computed(() =>
  isAuthError.value ? t('auth.gate.errorDescription') : t('auth.gate.signedOutDescription'),
);
</script>

<template>
  <div class="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-6 py-16">
    <div class="w-full max-w-md text-center">
      <span
        class="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground"
      >
        <Icon
          :icon="isAuthError ? 'lucide:shield-alert' : 'lucide:log-out'"
          width="28"
          height="28"
          aria-hidden="true"
        />
      </span>
      <h1 class="text-2xl font-semibold tracking-tight">{{ title }}</h1>
      <p class="mt-3 text-sm leading-relaxed text-muted-foreground">{{ description }}</p>
      <button
        type="button"
        class="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        @click="auth.login"
      >
        <Icon icon="lucide:log-in" width="16" height="16" aria-hidden="true" />
        {{ t('auth.gate.signIn') }}
      </button>
    </div>
  </div>
</template>
