/**
 * @vitest-environment jsdom
 */
import { createApp, nextTick } from 'vue';
import MarkdownRender, { isKatexEnabled } from 'markstream-vue';
import { afterEach, describe, expect, it } from 'vitest';

import { setupMarkstreamMath } from '../src/lib/setupMarkstreamMath';

describe('setupMarkstreamMath', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('enables katex with an injected renderer instance', () => {
    setupMarkstreamMath();

    expect(isKatexEnabled()).toBe(true);
    const katex = (globalThis as { katex?: { renderToString: (tex: string) => string } }).katex;
    expect(katex?.renderToString('\\lambda')).toContain('katex');
  });

  it('renders display math instead of raw dollar delimiters', async () => {
    setupMarkstreamMath();
    const host = document.createElement('div');
    document.body.appendChild(host);

    const app = createApp(MarkdownRender, {
      content: '$$\\mathcal{F}\\{f(t)\\} = F(\\omega)$$\n',
      final: true,
      mode: 'chat',
    });
    app.mount(host);

    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 50));
    await nextTick();

    expect(host.querySelector('.katex, .katex-display')).not.toBeNull();
    expect(host.textContent).not.toContain('$$');
    app.unmount();
  });
});
