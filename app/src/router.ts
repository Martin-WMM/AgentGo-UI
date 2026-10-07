import { createRouter, createWebHistory } from 'vue-router';

import ChatView from './views/ChatView.vue';
import HomeView from './views/HomeView.vue';
import SettingsView from './views/SettingsView.vue';
import { useAuthStore } from './stores/auth';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/chat', name: 'chat', component: ChatView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
});

router.beforeEach(async () => {
  const auth = useAuthStore();
  const session = await auth.loadSession();
  if (session.authenticated) {
    // The session endpoint is sufficient to authorize navigation. Profile data
    // is loaded by the settings view and must not block the home/chat shell.
    return true;
  }

  auth.login();
  return false;
});
