/**
 * @vitest-environment jsdom
 */
import { createApp, nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import ChatMessageActions from '../src/components/ChatMessageActions.vue';
import { i18n } from '../src/i18n';

async function mountActions(props: Record<string, unknown>) {
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp(ChatMessageActions, props);
  app.use(i18n);
  app.mount(host);
  await nextTick();
  return { host, app };
}

describe('ChatMessageActions', () => {
  it('renders action icons and formats first-token latency', async () => {
    const { host, app } = await mountActions({
      ttftMs: 842,
      liked: null,
      speaking: false,
    });

    expect(host.querySelector('[aria-label="Copy answer"], [aria-label="复制回答"]')).not.toBeNull();
    expect(host.textContent).toMatch(/842/);
    app.unmount();
  });

  it('emits copy when the copy button is clicked', async () => {
    const onCopy = vi.fn();
    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp(ChatMessageActions, {
      ttftMs: 1200,
      onCopy,
    });
    app.use(i18n);
    app.mount(host);
    await nextTick();
    const button = host.querySelector('button');
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onCopy).toHaveBeenCalled();
    app.unmount();
  });
});
