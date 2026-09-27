<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAuthStore } from '../stores/auth';

const { t } = useI18n();
const auth = useAuthStore();
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const saved = ref(false);
const username = ref('');
const form = reactive({ displayName: '', email: '', avatarUrl: '' });

onMounted(async () => {
  try {
    const profile = await auth.loadProfile();
    username.value = profile.username;
    form.displayName = profile.displayName;
    form.email = profile.email ?? '';
    form.avatarUrl = profile.avatarUrl ?? '';
  } catch {
    error.value = t('profile.loadError');
  } finally {
    loading.value = false;
  }
});

async function saveProfile() {
  saving.value = true;
  saved.value = false;
  error.value = '';
  try {
    const profile = await auth.updateProfile({
      displayName: form.displayName,
      email: form.email || undefined,
      avatarUrl: form.avatarUrl || undefined,
    });
    form.displayName = profile.displayName;
    form.email = profile.email ?? '';
    form.avatarUrl = profile.avatarUrl ?? '';
    saved.value = true;
  } catch {
    error.value = t('profile.saveError');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="mx-auto min-h-[calc(100vh-129px)] w-full max-w-3xl px-4 py-12 sm:px-6">
    <div class="mb-8 flex items-start gap-4">
      <div class="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
        <Icon icon="lucide:sliders-horizontal" width="22" height="22" aria-hidden="true" />
      </div>
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">{{ t('settings.title') }}</h1>
        <p class="mt-2 text-muted-foreground">{{ t('settings.description') }}</p>
      </div>
    </div>
    <form
      class="space-y-6 rounded-2xl border border-input bg-background p-6"
      @submit.prevent="saveProfile"
    >
      <div>
        <h2 class="text-lg font-semibold">{{ t('profile.title') }}</h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ t('profile.description') }}</p>
      </div>

      <div v-if="loading" class="text-sm text-muted-foreground">{{ t('profile.loading') }}</div>
      <div v-else class="space-y-5">
        <div class="space-y-2">
          <label for="profile-username" class="text-sm font-medium">{{
            t('profile.username')
          }}</label>
          <input
            id="profile-username"
            v-model="username"
            disabled
            class="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm"
            :placeholder="t('profile.managedByAuthentik')"
          />
          <p class="text-xs text-muted-foreground">{{ t('profile.usernameHint') }}</p>
        </div>
        <div class="space-y-2">
          <label for="profile-display-name" class="text-sm font-medium">{{
            t('profile.displayName')
          }}</label>
          <input
            id="profile-display-name"
            v-model="form.displayName"
            required
            maxlength="150"
            class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div class="space-y-2">
          <label for="profile-email" class="text-sm font-medium">{{ t('profile.email') }}</label>
          <input
            id="profile-email"
            v-model="form.email"
            type="email"
            maxlength="254"
            class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div class="space-y-2">
          <label for="profile-avatar" class="text-sm font-medium">{{
            t('profile.avatarUrl')
          }}</label>
          <input
            id="profile-avatar"
            v-model="form.avatarUrl"
            type="url"
            maxlength="2048"
            class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            :placeholder="t('profile.avatarPlaceholder')"
          />
        </div>
        <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
        <p v-if="saved" role="status" class="text-sm text-emerald-600">{{ t('profile.saved') }}</p>
        <button
          type="submit"
          :disabled="saving"
          class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ saving ? t('profile.saving') : t('profile.save') }}
        </button>
      </div>
    </form>
  </section>
</template>
