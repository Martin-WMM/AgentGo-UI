import { apiData } from './fileRequest';

/** Color theme stored by the settings API. */
export type ApiTheme = 'LIGHT' | 'DARK' | 'SYSTEM';

/** Interface language stored by the settings API. */
export type ApiLocale = 'EN' | 'ZH_CN';

/** Information density stored by the settings API. */
export type ApiDensity = 'COMFORTABLE' | 'COMPACT';

/** Theme preference applied in the browser. */
export type ThemePreference = 'light' | 'dark' | 'system';

/** Locale applied by vue-i18n. */
export type SettingsLocale = 'en' | 'zh-CN';

/** Density applied on the document element. */
export type DensityPreference = 'comfortable' | 'compact';

/** System settings used by the AgentGo shell. */
export interface UserSettings {
  theme: ThemePreference;
  locale: SettingsLocale;
  sidebarCollapsed: boolean;
  density: DensityPreference;
  reduceMotion: boolean;
  persisted: boolean;
  updatedAt: string | null;
}

interface ApiUserSettings {
  theme: ApiTheme;
  locale: ApiLocale;
  sidebarCollapsed: boolean;
  density: ApiDensity;
  reduceMotion: boolean;
  persisted: boolean;
  updatedAt?: string | null;
}

const themeFromApi: Record<ApiTheme, ThemePreference> = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

const themeToApi: Record<ThemePreference, ApiTheme> = {
  light: 'LIGHT',
  dark: 'DARK',
  system: 'SYSTEM',
};

const localeFromApi: Record<ApiLocale, SettingsLocale> = {
  EN: 'en',
  ZH_CN: 'zh-CN',
};

const localeToApi: Record<SettingsLocale, ApiLocale> = {
  en: 'EN',
  'zh-CN': 'ZH_CN',
};

const densityFromApi: Record<ApiDensity, DensityPreference> = {
  COMFORTABLE: 'comfortable',
  COMPACT: 'compact',
};

const densityToApi: Record<DensityPreference, ApiDensity> = {
  comfortable: 'COMFORTABLE',
  compact: 'COMPACT',
};

function fromApi(body: ApiUserSettings): UserSettings {
  return {
    theme: themeFromApi[body.theme] ?? 'system',
    locale: localeFromApi[body.locale] ?? 'en',
    sidebarCollapsed: Boolean(body.sidebarCollapsed),
    density: densityFromApi[body.density] ?? 'comfortable',
    reduceMotion: Boolean(body.reduceMotion),
    persisted: Boolean(body.persisted),
    updatedAt: body.updatedAt ?? null,
  };
}

function toApi(settings: UserSettings): ApiUserSettings {
  return {
    theme: themeToApi[settings.theme],
    locale: localeToApi[settings.locale],
    sidebarCollapsed: settings.sidebarCollapsed,
    density: densityToApi[settings.density],
    reduceMotion: settings.reduceMotion,
    persisted: settings.persisted,
  };
}

/** Loads the authenticated user's system settings. */
export async function fetchUserSettings(): Promise<UserSettings> {
  return fromApi(await apiData<ApiUserSettings>('/api/v1/settings'));
}

/** Creates or replaces the authenticated user's system settings. */
export async function saveUserSettings(settings: UserSettings): Promise<UserSettings> {
  const payload = toApi(settings);
  return fromApi(
    await apiData<ApiUserSettings>('/api/v1/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theme: payload.theme,
        locale: payload.locale,
        sidebarCollapsed: payload.sidebarCollapsed,
        density: payload.density,
        reduceMotion: payload.reduceMotion,
      }),
    }),
  );
}
