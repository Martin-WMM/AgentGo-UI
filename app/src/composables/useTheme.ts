import { ref } from 'vue';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'agentgo-theme';

const preference = ref<ThemePreference>('system');
const theme = ref<ResolvedTheme>('light');
let initialized = false;
let media: MediaQueryList | null = null;

function readStoredPreference(): ThemePreference {
  const storedTheme = localStorage.getItem(STORAGE_KEY);
  if (storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'system')
    return storedTheme;
  return 'system';
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(nextPreference: ThemePreference): ResolvedTheme {
  return nextPreference === 'system' ? systemTheme() : nextPreference;
}

function paint(nextPreference: ThemePreference) {
  preference.value = nextPreference;
  const resolved = resolveTheme(nextPreference);
  theme.value = resolved;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.colorScheme = resolved;
  localStorage.setItem(STORAGE_KEY, nextPreference);
}

function onSystemThemeChange() {
  if (preference.value === 'system') paint('system');
}

function ensureTheme() {
  if (initialized || typeof document === 'undefined') return;
  initialized = true;
  media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onSystemThemeChange);
  paint(readStoredPreference());
}

/** Applies a theme preference immediately and caches it for the next page load. */
export function applyThemePreference(nextPreference: ThemePreference) {
  ensureTheme();
  paint(nextPreference);
}

export function useTheme() {
  ensureTheme();

  function toggleTheme() {
    paint(theme.value === 'dark' ? 'light' : 'dark');
  }

  return { theme, preference, applyThemePreference, toggleTheme };
}
