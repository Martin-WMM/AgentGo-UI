import katex from 'katex';
import { clearKaTeXWorker, enableKatex } from 'markstream-vue';

import 'katex/dist/katex.min.css';

type KatexApi = {
  renderToString: (tex: string, options?: Record<string, unknown>) => string;
};

function resolveKatexApi(): KatexApi {
  const mod = katex as unknown as KatexApi & { default?: KatexApi };
  const api = mod.default ?? mod;
  if (typeof api.renderToString !== 'function') {
    throw new Error('KaTeX renderToString is unavailable.');
  }
  return api;
}

/**
 * Wires KaTeX into markstream-vue for chat Markdown math.
 *
 * Uses the app-bundled KaTeX on the main thread only. A CDN worker was tried
 * earlier, but a failed worker made MathBlock fall back to raw $$...$$ text
 * even when the local KaTeX package was healthy.
 */
export function setupMarkstreamMath(): void {
  const api = resolveKatexApi();
  clearKaTeXWorker();
  (globalThis as Record<string, unknown>).katex = api;
  enableKatex(() => api as never);
  // Warm the renderer so the first math node can use the sync path.
  api.renderToString('x', { throwOnError: false, displayMode: false });
}
