/**
 * @vitest-environment jsdom
 */
import { createApp, nextTick, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ComposerTrailingActions from '../src/components/ComposerTrailingActions.vue';
import { i18n } from '../src/i18n';

const uploadFile = vi.fn().mockResolvedValue(undefined);
const createWorkspace = vi.fn().mockResolvedValue({
  id: 'upload-ws',
  name: 'Home uploads',
});

vi.mock('../src/composables/useWorkspaces', () => ({
  useWorkspaces: () => ({
    workspaces: { value: [] },
    createWorkspace,
    uploadFile,
  }),
}));

vi.mock('@agentgo/ui', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

describe('ComposerTrailingActions', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    uploadFile.mockClear();
    createWorkspace.mockClear();
  });

  it('renders attach and voice controls beside the composer', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const model = ref('');
    const app = createApp(ComposerTrailingActions, {
      modelValue: model.value,
      'onUpdate:modelValue': (value: string) => {
        model.value = value;
      },
    });
    app.use(i18n);
    app.mount(host);
    await nextTick();

    const buttons = Array.from(host.querySelectorAll('button'));
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.getAttribute('aria-label')).toMatch(/Attach|添加文件/);
    expect(buttons[1]?.getAttribute('aria-label')).toMatch(/voice|语音/i);
    expect(host.querySelector('input[type="file"]')).not.toBeNull();
    app.unmount();
  });

  it('uploads a single selected file into the preferred workspace', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp(ComposerTrailingActions, {
      modelValue: '',
      workspaceId: 'ws-preferred',
    });
    app.use(i18n);
    app.mount(host);
    await nextTick();

    const input = host.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'note.txt', { type: 'text/plain' });
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [file],
    });
    input.dispatchEvent(new Event('change'));
    await vi.waitFor(() => {
      expect(uploadFile).toHaveBeenCalledWith('ws-preferred', file);
    });
    expect(createWorkspace).not.toHaveBeenCalled();
    app.unmount();
  });
});
