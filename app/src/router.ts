import { createRouter, createWebHistory } from 'vue-router';

import AuthGateView from './views/AuthGateView.vue';
import ChatView from './views/ChatView.vue';
import ConsolePlaceholderView from './views/ConsolePlaceholderView.vue';
import FilesView from './views/FilesView.vue';
import HomeView from './views/HomeView.vue';
import SettingsView from './views/SettingsView.vue';
import WorkspaceFilesView from './views/WorkspaceFilesView.vue';
import { useAuthStore } from './stores/auth';

function hasUnauthenticatedGateQuery(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('authError') || params.has('signedOut');
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/chat', name: 'chat', component: ChatView },
    { path: '/signed-out', name: 'signed-out', component: AuthGateView },
    { path: '/auth-error', name: 'auth-error', component: AuthGateView },
    { path: '/settings', redirect: '/console/settings' },
    { path: '/console/settings', name: 'console-settings', component: SettingsView },
    { path: '/console/files', name: 'console-files', component: FilesView },
    {
      path: '/console/files/:workspaceId',
      name: 'workspace-files',
      component: WorkspaceFilesView,
    },
    { path: '/console/models', name: 'console-models', component: ConsolePlaceholderView },
    {
      path: '/console/connections',
      name: 'console-connections',
      component: ConsolePlaceholderView,
    },
    { path: '/console/mcp', name: 'console-mcp', component: ConsolePlaceholderView },
    { path: '/console/skills', name: 'console-skills', component: ConsolePlaceholderView },
    { path: '/console/a2a', name: 'console-a2a', component: ConsolePlaceholderView },
    { path: '/console/prompts', name: 'console-prompts', component: ConsolePlaceholderView },
    { path: '/console/apis', name: 'console-apis', component: ConsolePlaceholderView },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  const session = await auth.loadSession();
  if (session.authenticated) {
    // The session endpoint is sufficient to authorize navigation. Profile data
    // is loaded by the settings view and must not block the home/chat shell.
    if (to.name === 'signed-out' || to.name === 'auth-error') {
      return { name: 'home', replace: true };
    }
    return true;
  }

  // Failed OAuth callbacks and post-logout redirects must not restart login
  // automatically, or the browser looks stuck in a redirect loop.
  if (hasUnauthenticatedGateQuery()) {
    const gateName = new URLSearchParams(window.location.search).has('authError')
      ? 'auth-error'
      : 'signed-out';
    if (to.name !== gateName) {
      return { name: gateName, query: to.query, replace: true };
    }
    return true;
  }

  if (to.name === 'signed-out' || to.name === 'auth-error') {
    return true;
  }

  auth.login();
  return false;
});
