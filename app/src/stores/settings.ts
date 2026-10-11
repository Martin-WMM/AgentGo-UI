import { toastError } from '@agentgo/ui';
import { defineStore } from 'pinia';

import {
  fetchUserSettings,
  saveUserSettings,
  type DensityPreference,
  type SettingsLocale,
  type ThemePreference,
  type UserSettings,
} from '../api/settings';
import { setCollapsed } from '../composables/useSidebar';
import { applyThemePreference } from '../composables/useTheme';
import { i18n } from '../i18n';
import { useAuthStore } from './auth';

export type UserSettingsPatch = Partial<
  Pick<UserSettings, 'theme' | 'locale' | 'sidebarCollapsed' | 'density' | 'reduceMotion'>
>;

const DENSITY_KEY = 'agentgo-density';
const MOTION_KEY = 'agentgo-reduce-motion';

let queue: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): Promise<void> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function readLocalSettings(): UserSettings {
  const storedTheme = localStorage.getItem('agentgo-theme');
  const theme: ThemePreference =
    storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
      ? storedTheme
      : 'system';
  const storedLocale = localStorage.getItem('agentgo-locale');
  const locale: SettingsLocale =
    storedLocale === 'zh-CN' || storedLocale === 'en'
      ? storedLocale
      : navigator.language.toLowerCase().startsWith('zh')
        ? 'zh-CN'
        : 'en';
  const storedDensity = localStorage.getItem(DENSITY_KEY);
  const density: DensityPreference = storedDensity === 'compact' ? 'compact' : 'comfortable';
  return {
    theme,
    locale,
    sidebarCollapsed: localStorage.getItem('agentgo-sidebar-collapsed') === 'true',
    density,
    reduceMotion: localStorage.getItem(MOTION_KEY) === 'true',
    persisted: false,
    updatedAt: null,
  };
}

function applySettings(settings: UserSettings) {
  applyThemePreference(settings.theme);
  i18n.global.locale.value = settings.locale;
  localStorage.setItem('agentgo-locale', settings.locale);
  setCollapsed(settings.sidebarCollapsed);
  document.documentElement.dataset.density = settings.density;
  document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion);
  localStorage.setItem(DENSITY_KEY, settings.density);
  localStorage.setItem(MOTION_KEY, String(settings.reduceMotion));
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: readLocalSettings(),
    synced: false,
    syncFailed: false,
  }),

  actions: {
    /** Paints the cached preferences before the account settings request returns. */
    applyLocal() {
      applySettings(this.settings);
    },

    /**
     * Loads account settings after sign-in.
     *
     * A missing server row adopts the preferences already cached on this device.
     * Failures stay quiet so navigation can continue with the local cache.
     */
    syncFromServer() {
      if (!useAuthStore().isAuthenticated || this.synced || this.syncFailed)
        return Promise.resolve();
      return enqueue(async () => {
        if (this.synced || this.syncFailed || !useAuthStore().isAuthenticated) return;
        try {
          const remote = await fetchUserSettings();
          if (!remote.persisted) {
            const saved = await saveUserSettings(this.settings);
            this.settings = saved;
          } else {
            this.settings = remote;
          }
          applySettings(this.settings);
          this.synced = true;
        } catch {
          this.syncFailed = true;
        }
      });
    },

    /** Applies [patch] immediately and saves it for the signed-in user. */
    update(patch: UserSettingsPatch) {
      const previous = { ...this.settings };
      const optimistic = { ...previous, ...patch };
      this.settings = optimistic;
      applySettings(optimistic);
      if (!useAuthStore().isAuthenticated) return Promise.resolve();
      return enqueue(async () => {
        try {
          if (!this.synced) {
            const remote = await fetchUserSettings();
            if (remote.persisted) {
              this.settings = { ...remote, ...patch };
              applySettings(this.settings);
            }
          }
          const saved = await saveUserSettings({ ...this.settings, ...patch });
          this.settings = saved;
          applySettings(saved);
          this.synced = true;
          this.syncFailed = false;
        } catch (error) {
          this.settings = previous;
          applySettings(previous);
          const detail = error instanceof Error ? error.message : '';
          toastError(detail || i18n.global.t('system.saveError'), i18n.global.t('toast.error'));
        }
      });
    },
  },
});
