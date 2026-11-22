// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import { onComposerEnterSubmit } from '../src/composables/useComposerEnterSubmit';

function enterEvent(init: KeyboardEventInit = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...init });
}

describe('onComposerEnterSubmit', () => {
  it('submits on Enter and ignores Shift+Enter and IME composition', () => {
    const submit = vi.fn();

    const send = enterEvent();
    onComposerEnterSubmit(send, submit);
    expect(send.defaultPrevented).toBe(true);
    expect(submit).toHaveBeenCalledTimes(1);

    const newline = enterEvent({ shiftKey: true });
    onComposerEnterSubmit(newline, submit);
    expect(newline.defaultPrevented).toBe(false);
    expect(submit).toHaveBeenCalledTimes(1);

    const composing = enterEvent({ isComposing: true });
    onComposerEnterSubmit(composing, submit);
    expect(composing.defaultPrevented).toBe(false);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('still submits when keyCode is 229 after composition has ended', () => {
    const submit = vi.fn();
    const event = enterEvent({ keyCode: 229 });

    onComposerEnterSubmit(event, submit);

    expect(event.defaultPrevented).toBe(true);
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
