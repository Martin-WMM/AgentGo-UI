import { createRouter, createWebHistory } from 'vue-router';

import A2aAgentEditorView from './views/A2aAgentEditorView.vue';
import A2aAgentsView from './views/A2aAgentsView.vue';
import AuthGateView from './views/AuthGateView.vue';
import ChatView from './views/ChatView.vue';
import ConsolePlaceholderView from './views/ConsolePlaceholderView.vue';
import EventLogsView from './views/EventLogsView.vue';
import FilesView from './views/FilesView.vue';
import HomeView from './views/HomeView.vue';
import McpServerEditorView from './views/McpServerEditorView.vue';
import McpServersView from './views/McpServersView.vue';
import ModelEditorView from './views/ModelEditorView.vue';
import ModelsView from './views/ModelsView.vue';
import PromptsView from './views/PromptsView.vue';
import PromptTemplateDetailView from './views/PromptTemplateDetailView.vue';
import PromptTemplateEditorView from './views/PromptTemplateEditorView.vue';
import PromptTemplateHistoryView from './views/PromptTemplateHistoryView.vue';
import ResourcesView from './views/ResourcesView.vue';
import SettingsView from './views/SettingsView.vue';
import WorkspaceEditorView from './views/WorkspaceEditorView.vue';
import WorkspaceFilesView from './views/WorkspaceFilesView.vue';
import ChartsTestView from './views/ChartsTestView.vue';
import CliExecutionView from './views/CliExecutionView.vue';
import { useAuthStore } from './stores/auth';
import { useSettingsStore } from './stores/settings';

function hasUnauthenticatedGateQuery(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('authError') || params.has('signedOut');
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/tests/charts',
      name: 'charts-test',
      component: ChartsTestView,
      meta: { public: true },
    },
    { path: '/chat', name: 'chat', component: ChatView },
    { path: '/signed-out', name: 'signed-out', component: AuthGateView },
    { path: '/auth-error', name: 'auth-error', component: AuthGateView },
    { path: '/settings', redirect: '/console/settings' },
    { path: '/console/settings', name: 'console-settings', component: SettingsView },
    { path: '/console/cli', name: 'console-cli', component: CliExecutionView },
    { path: '/console/events', name: 'console-events', component: EventLogsView },
    { path: '/console/resources', name: 'console-resources', component: ResourcesView },
    { path: '/console/files', name: 'console-files', component: FilesView },
    {
      path: '/console/files/new',
      name: 'workspace-create',
      component: WorkspaceEditorView,
    },
    {
      path: '/console/files/:workspaceId/edit',
      name: 'workspace-edit',
      component: WorkspaceEditorView,
    },
    {
      path: '/console/files/:workspaceId',
      name: 'workspace-files',
      component: WorkspaceFilesView,
    },
    { path: '/console/models', name: 'console-models', component: ModelsView },
    {
      path: '/console/models/new',
      name: 'model-create',
      component: ModelEditorView,
    },
    {
      path: '/console/models/:id/edit',
      name: 'model-edit',
      component: ModelEditorView,
    },
    {
      path: '/console/connections',
      name: 'console-connections',
      component: ConsolePlaceholderView,
    },
    { path: '/console/mcp', name: 'console-mcp', component: McpServersView },
    {
      path: '/console/mcp/new',
      name: 'mcp-server-create',
      component: McpServerEditorView,
    },
    {
      path: '/console/mcp/:id/edit',
      name: 'mcp-server-edit',
      component: McpServerEditorView,
    },
    { path: '/console/skills', name: 'console-skills', component: ConsolePlaceholderView },
    { path: '/console/a2a', name: 'console-a2a', component: A2aAgentsView },
    {
      path: '/console/a2a/new',
      name: 'a2a-agent-create',
      component: A2aAgentEditorView,
    },
    {
      path: '/console/a2a/:id/edit',
      name: 'a2a-agent-edit',
      component: A2aAgentEditorView,
    },
    { path: '/console/prompts', name: 'console-prompts', component: PromptsView },
    {
      path: '/console/prompts/new',
      name: 'prompt-template-create',
      component: PromptTemplateEditorView,
    },
    {
      path: '/console/prompts/history',
      name: 'prompt-template-history',
      component: PromptTemplateHistoryView,
    },
    {
      path: '/console/prompts/:id/edit',
      name: 'prompt-template-edit',
      component: PromptTemplateEditorView,
    },
    {
      path: '/console/prompts/:id',
      name: 'prompt-template-view',
      component: PromptTemplateDetailView,
    },
    { path: '/console/apis', name: 'console-apis', component: ConsolePlaceholderView },
  ],
});

router.beforeEach(async (to) => {
  if (to.meta.public) return true;
  const auth = useAuthStore();
  const session = await auth.loadSession();
  if (session.authenticated) {
    void useSettingsStore().syncFromServer();
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
