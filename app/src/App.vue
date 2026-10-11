<script setup lang="ts">
import { ToastHost } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, RouterView, useRoute } from 'vue-router';

import AppHeaderActions from './components/AppHeaderActions.vue';
import AppSidebar from './components/AppSidebar.vue';
import { useSidebar } from './composables/useSidebar';
import { useTheme } from './composables/useTheme';
import { useWorkspaces } from './composables/useWorkspaces';
import { consoleNavItems } from './navigation';
import { useAuthStore } from './stores/auth';

const { t } = useI18n();
const { theme } = useTheme();
const { openMobile } = useSidebar();
const { getWorkspace } = useWorkspaces();
const auth = useAuthStore();
const route = useRoute();
const isDark = computed(() => theme.value === 'dark');
const isAuthGate = computed(() => route.name === 'signed-out' || route.name === 'auth-error');
const showAppShell = computed(() => auth.isAuthenticated && !isAuthGate.value);
const logoSource = computed(() =>
  isDark.value ? '/assets/logo-dark.png' : '/assets/logo-light.png',
);
const breadcrumbs = computed(() => {
  if (!route.path.startsWith('/console')) return [];
  const navItem = consoleNavItems.find(
    (item) => route.path === item.to || route.path.startsWith(`${item.to}/`),
  );
  if (!navItem) return [];
  const items = [
    { label: t('console.title'), to: undefined as string | undefined },
    { label: t(`console.items.${navItem.key}`), to: navItem.to },
  ];
  if (route.name === 'workspace-files') {
    const workspace = getWorkspace(String(route.params.workspaceId));
    items.push({ label: workspace?.name || t('files.notFound'), to: undefined });
