/**
 * @vitest-environment jsdom
 */
import { createApp, nextTick } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ComposerConfigBlocks from '../src/components/ComposerConfigBlocks.vue';
import { i18n } from '../src/i18n';

vi.mock('../src/composables/useWorkspaces', () => ({
  useWorkspaces: () => ({
    workspaces: {
      value: [
        {
          id: 'w1',
          groupName: 'default',
          name: 'Docs',
          description: '',
          color: '#fff',
          createdAt: '',
        },
      ],
    },
    ensureLoaded: vi.fn().mockResolvedValue(undefined),
    refreshWorkspaces: vi.fn(),
  }),
}));

vi.mock('../src/composables/useMcpServers', () => ({
  useMcpServers: () => ({
    servers: {
      value: [
        {
          id: 'm1',
          name: 'Tools',
          endpointUrl: 'https://mcp.example',
          enabled: true,
        },
      ],
    },
    refreshServers: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../src/composables/useA2aAgents', () => ({
  useA2aAgents: () => ({
    agents: {
      value: [{ id: 'a1', name: 'Helper', cardUrl: 'https://a2a.example', enabled: true }],
    },
    refreshAgents: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('ComposerConfigBlocks', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the seven config blocks and opens workspace options', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp(ComposerConfigBlocks);
    app.use(i18n);
    app.mount(host);
    await nextTick();

    expect(host.textContent).toContain('Workspace');
    expect(host.textContent).toContain('Databases');
    expect(host.textContent).toContain('MCP');
    expect(host.textContent).toContain('A2A');
    expect(host.textContent).toContain('APIs');
    expect(host.textContent).toMatch(/Knowledge|知识库/);
    expect(host.textContent).toMatch(/Mode|模式/);

    const workspaceButton = Array.from(host.querySelectorAll('button')).find((button) =>
      /Workspace|工作区/.test(button.textContent ?? ''),
    );
    workspaceButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    await vi.waitFor(() => {
      expect(host.textContent).toContain('Docs');
    });
    app.unmount();
  });
});
