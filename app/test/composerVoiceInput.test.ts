/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';

import { useComposerVoiceInput } from '../src/composables/useComposerVoiceInput';

describe('useComposerVoiceInput', () => {
  it('reports unsupported browsers without throwing', () => {
    const onUnsupported = vi.fn();
    const app = createApp({
      setup() {
        const voice = useComposerVoiceInput({
          locale: () => 'en',
          appendText: vi.fn(),
          onUnsupported,
          onError: vi.fn(),
        });
        voice.start();
        expect(onUnsupported).toHaveBeenCalled();
        expect(voice.listening.value).toBe(false);
        return () => null;
      },
    });
    app.mount(document.createElement('div'));
    app.unmount();
  });
});
