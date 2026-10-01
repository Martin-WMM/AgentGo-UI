import { ref } from 'vue';

export type Theme = 'light' | 'dark';

const theme = ref<Theme>('light');
let initialized = false;

function getInitialTheme(): Theme {
  const storedTheme = localStorage.getItem('agentgo-theme');
  if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(nextTheme: Theme) {
  theme.value = nextTheme;
  document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  document.documentElement.style.colorScheme = nextTheme;
  localStorage.setItem('agentgo-theme', nextTheme);
}

export function useTheme() {
  if (!initialized) {
    applyTheme(getInitialTheme());
    initialized = true;
  }

  function toggleTheme() {
    applyTheme(theme.value === 'dark' ? 'light' : 'dark');
  }

  return { theme, toggleTheme };
}
