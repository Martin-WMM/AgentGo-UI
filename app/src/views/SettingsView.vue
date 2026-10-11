<script setup lang="ts">
import { toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { apiRequest } from '../api/fileRequest';
import SystemSettingsPanel from '../components/SystemSettingsPanel.vue';
import { useAuthenticatedImage } from '../composables/useAuthenticatedImage';
import { backendBaseUrl, useAuthStore } from '../stores/auth';

const { t } = useI18n();
const auth = useAuthStore();
const loading = ref(true);
const saving = ref(false);
const uploading = ref(false);
const username = ref('');
const form = reactive({
  displayName: '',
  email: '',
  avatarUrl: '',
  phoneNumber: '',
  description: '',
  occupation: '',
  organization: '',
  homepageUrl: '',
  location: '',
  timezone: '',
  preferredLanguage: '',
});

const fieldClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring';
const avatarSource = computed(() => {
  if (loading.value) return '';
  return form.avatarUrl.trim() || `${backendBaseUrl}/api/v1/files/avatar`;
});
const { displayUrl } = useAuthenticatedImage(avatarSource);
const initials = computed(() => {
  const letters = (form.displayName || username.value)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return letters || '?';
});
const customLanguage = computed(
  () =>
    form.preferredLanguage !== '' &&
    form.preferredLanguage !== 'en' &&
    form.preferredLanguage !== 'zh-CN',
);
const isDataAvatar = computed(() => form.avatarUrl.trim().toLowerCase().startsWith('data:image/'));
const avatarUrlInput = computed({
  get: () => (isDataAvatar.value ? '' : form.avatarUrl),
  set: (value: string) => {
    form.avatarUrl = value;
  },
});

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function applyProfile(profile: Awaited<ReturnType<typeof auth.loadProfile>>) {
  username.value = profile.username;
  form.displayName = profile.displayName;
  form.email = profile.email ?? '';
  form.avatarUrl = profile.avatarUrl ?? '';
  form.phoneNumber = profile.phoneNumber ?? '';
  form.description = profile.description ?? '';
  form.occupation = profile.occupation ?? '';
  form.organization = profile.organization ?? '';
  form.homepageUrl = profile.homepageUrl ?? '';
  form.location = profile.location ?? '';
  form.timezone = profile.timezone ?? '';
  form.preferredLanguage = profile.preferredLanguage ?? '';
}

onMounted(async () => {
  try {
    applyProfile(await auth.loadProfile());
  } catch (error) {
    const detail = error instanceof Error ? error.message : '';
    toastError(detail || t('profile.loadError'), t('toast.error'));
  } finally {
    loading.value = false;
  }
});

async function onAvatarSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  uploading.value = true;
  try {
    const body = new FormData();
    body.append('file', file);
    await apiRequest('/api/v1/files/avatar', { method: 'PUT', body });
    form.avatarUrl = `${backendBaseUrl}/api/v1/files/avatar`;
    auth.setAvatarUrl(form.avatarUrl);
    toastSuccess(t('profile.avatarUploaded'), t('toast.success'));
  } catch (error) {
    const detail = error instanceof Error ? error.message : '';
    toastError(detail || t('profile.avatarUploadError'), t('toast.error'));
  } finally {
    uploading.value = false;
  }
}

async function saveProfile() {
  saving.value = true;
  try {
    const profile = await auth.updateProfile({
      displayName: form.displayName.trim(),
      email: emptyToNull(form.email),
      // Authentik default data: avatars are display-only; do not send them back as updates.
      avatarUrl: isDataAvatar.value ? null : emptyToNull(form.avatarUrl),
      phoneNumber: emptyToNull(form.phoneNumber),
      description: emptyToNull(form.description),
      occupation: emptyToNull(form.occupation),
      organization: emptyToNull(form.organization),
      homepageUrl: emptyToNull(form.homepageUrl),
      location: emptyToNull(form.location),
      timezone: emptyToNull(form.timezone),
      preferredLanguage: emptyToNull(form.preferredLanguage),
    });
    applyProfile(profile);
    toastSuccess(t('profile.saved'), t('toast.success'));
  } catch (error) {
    const detail = error instanceof Error ? error.message : '';
    toastError(detail || t('profile.saveError'), t('toast.error'));
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
    <div class="space-y-8">
      <SystemSettingsPanel />
      <form
        class="space-y-8 rounded-2xl border border-input bg-background p-6"
        @submit.prevent="saveProfile"
      >
        <div>
          <h2 class="text-lg font-semibold">{{ t('profile.title') }}</h2>
          <p class="mt-1 text-sm text-muted-foreground">{{ t('profile.description') }}</p>
        </div>

        <div v-if="loading" class="text-sm text-muted-foreground">{{ t('profile.loading') }}</div>
        <div v-else class="space-y-8">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span
              class="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-lg font-bold text-white"
            >
              <img v-if="displayUrl" :src="displayUrl" alt="" class="size-full object-cover" />
              <span v-else>{{ initials }}</span>
            </span>
            <div class="min-w-0 flex-1 space-y-3">
              <div class="flex flex-wrap items-center gap-3">
                <label
                  class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                  <Icon icon="lucide:upload" width="16" height="16" aria-hidden="true" />
                  {{ uploading ? t('profile.avatarUploading') : t('profile.avatarUpload') }}
                  <input
                    class="sr-only"
                    type="file"
                    accept="image/*"
                    :disabled="uploading"
                    @change="onAvatarSelected"
                  />
                </label>
                <p v-if="isDataAvatar" class="text-xs text-muted-foreground">
                  {{ t('profile.avatarFromAuthentik') }}
                </p>
              </div>
              <div class="space-y-2">
                <label for="profile-avatar" class="text-sm font-medium">{{
                  t('profile.avatarUrl')
                }}</label>
                <input
                  id="profile-avatar"
                  v-model="avatarUrlInput"
                  type="text"
                  inputmode="url"
                  maxlength="2048"
                  :class="fieldClass"
                  :placeholder="
                    isDataAvatar
                      ? t('profile.avatarDataPlaceholder')
                      : t('profile.avatarPlaceholder')
                  "
                />
              </div>
            </div>
          </div>

          <section class="space-y-5">
            <div>
              <h3 class="text-base font-semibold">{{ t('profile.account') }}</h3>
              <p class="mt-1 text-sm text-muted-foreground">{{ t('profile.accountHint') }}</p>
            </div>
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
            <div class="grid gap-5 sm:grid-cols-2">
              <div class="space-y-2">
                <label for="profile-display-name" class="text-sm font-medium">{{
                  t('profile.displayName')
                }}</label>
                <input
                  id="profile-display-name"
                  v-model="form.displayName"
                  required
                  maxlength="150"
                  :class="fieldClass"
                />
              </div>
              <div class="space-y-2">
                <label for="profile-email" class="text-sm font-medium">{{
                  t('profile.email')
                }}</label>
                <input
                  id="profile-email"
                  v-model="form.email"
                  type="email"
                  maxlength="254"
                  :class="fieldClass"
                />
              </div>
            </div>
          </section>

          <section class="space-y-5">
            <div>
              <h3 class="text-base font-semibold">{{ t('profile.personal') }}</h3>
              <p class="mt-1 text-sm text-muted-foreground">{{ t('profile.personalHint') }}</p>
            </div>
            <div class="grid gap-5 sm:grid-cols-2">
              <div class="space-y-2">
                <label for="profile-phone" class="text-sm font-medium">{{
                  t('profile.phone')
                }}</label>
                <input
                  id="profile-phone"
                  v-model="form.phoneNumber"
                  type="tel"
                  maxlength="32"
                  autocomplete="tel"
                  :class="fieldClass"
                />
              </div>
              <div class="space-y-2">
                <label for="profile-occupation" class="text-sm font-medium">{{
                  t('profile.occupation')
                }}</label>
                <input
                  id="profile-occupation"
                  v-model="form.occupation"
                  maxlength="128"
                  :class="fieldClass"
                />
              </div>
              <div class="space-y-2">
                <label for="profile-organization" class="text-sm font-medium">{{
                  t('profile.organization')
                }}</label>
                <input
                  id="profile-organization"
                  v-model="form.organization"
                  maxlength="255"
                  :class="fieldClass"
                />
              </div>
              <div class="space-y-2">
                <label for="profile-location" class="text-sm font-medium">{{
                  t('profile.location')
                }}</label>
                <input
                  id="profile-location"
                  v-model="form.location"
                  maxlength="255"
                  :class="fieldClass"
                />
              </div>
              <div class="space-y-2">
                <label for="profile-homepage" class="text-sm font-medium">{{
                  t('profile.homepage')
                }}</label>
                <input
                  id="profile-homepage"
                  v-model="form.homepageUrl"
                  type="url"
                  maxlength="2048"
                  :class="fieldClass"
                  :placeholder="t('profile.homepagePlaceholder')"
                />
              </div>
              <div class="space-y-2">
                <label for="profile-timezone" class="text-sm font-medium">{{
                  t('profile.timezone')
                }}</label>
                <input
                  id="profile-timezone"
                  v-model="form.timezone"
                  maxlength="64"
                  :class="fieldClass"
                  :placeholder="t('profile.timezonePlaceholder')"
                />
              </div>
              <div class="space-y-2 sm:col-span-2">
                <label for="profile-language" class="text-sm font-medium">{{
                  t('profile.language')
                }}</label>
                <select id="profile-language" v-model="form.preferredLanguage" :class="fieldClass">
                  <option value="">{{ t('profile.languageUnset') }}</option>
                  <option v-if="customLanguage" :value="form.preferredLanguage">
                    {{ form.preferredLanguage }}
                  </option>
                  <option value="en">English</option>
                  <option value="zh-CN">简体中文</option>
                </select>
              </div>
            </div>
            <div class="space-y-2">
              <label for="profile-bio" class="text-sm font-medium">{{ t('profile.bio') }}</label>
              <textarea
                id="profile-bio"
                v-model="form.description"
                maxlength="2000"
                rows="4"
                :class="`${fieldClass} resize-y`"
                :placeholder="t('profile.bioPlaceholder')"
              />
            </div>
          </section>

          <button
            type="submit"
            :disabled="saving"
            class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ saving ? t('profile.saving') : t('profile.save') }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
