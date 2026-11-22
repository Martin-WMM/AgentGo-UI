/**
 * Enter submits the composer. Shift+Enter keeps the browser newline.
 * While an IME composition is active, Enter only confirms the candidate.
 */
export function onComposerEnterSubmit(
  event: KeyboardEvent,
  submit: () => void,
): void {
  if (event.key !== 'Enter') return;
  if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.isComposing) return;
  event.preventDefault();
  submit();
}
