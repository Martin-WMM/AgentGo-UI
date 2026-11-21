const CONTROL_SELECTOR = 'button, a, [role="button"]';

export interface IconTipTarget {
  element: HTMLElement;
  label: string;
}

/**
 * Label for an icon-only control, taken from its accessible name.
 * Controls that already show text are skipped so the tip does not repeat it.
 */
export function iconTipLabel(element: HTMLElement): string | null {
  if (!element.matches(CONTROL_SELECTOR)) return null;
  if (element.getAttribute('aria-hidden') === 'true') return null;
  if (!hasVisibleIcon(element) || hasVisibleText(element)) return null;
  const explicit =
    element.getAttribute('aria-label')?.trim() || element.getAttribute('title')?.trim();
  if (explicit) return explicit;
  return hiddenText(element) || null;
}

/** Smallest icon-only control whose box contains the pointer. */
export function findIconButton(x: number, y: number): IconTipTarget | null {
  const top = document.elementFromPoint(x, y);
  let best: (IconTipTarget & { area: number }) | null = null;
  for (const node of document.querySelectorAll(CONTROL_SELECTOR)) {
    if (!(node instanceof HTMLElement)) continue;
    const rect = node.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) continue;
    if (isVisuallyHidden(node)) continue;
    if (!hitBelongsToControl(node, top)) continue;
    const label = iconTipLabel(node);
    if (!label) continue;
    const area = rect.width * rect.height;
    if (!best || area < best.area) best = { element: node, label, area };
  }
  return best ? { element: best.element, label: best.label } : null;
}

function hasVisibleIcon(root: HTMLElement): boolean {
  for (const svg of root.querySelectorAll('svg')) {
    if (isInVisuallyHiddenSubtree(svg, root)) continue;
    return true;
  }
  return false;
}

function hasVisibleText(root: HTMLElement): boolean {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const text = node.textContent?.replace(/\s+/g, '') ?? '';
    const parent = node.parentElement;
    if (text && parent && !isTextConcealed(parent, root)) return true;
    node = walker.nextNode();
  }
  return false;
}

function hiddenText(root: HTMLElement): string {
  const parts: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const text = node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    const parent = node.parentElement;
    if (text && parent && isAccessibleHiddenText(parent, root)) parts.push(text);
    node = walker.nextNode();
  }
  return parts.join(' ').trim();
}

function isTextConcealed(parent: Element, root: HTMLElement): boolean {
  let current: Element | null = parent;
  while (current && current !== root) {
    if (current instanceof SVGElement || current.localName === 'title') return true;
    if (current.getAttribute('aria-hidden') === 'true') return true;
    if (isVisuallyHidden(current)) return true;
    current = current.parentElement;
  }
  return false;
}

function isAccessibleHiddenText(parent: Element, root: HTMLElement): boolean {
  let current: Element | null = parent;
  let visuallyHidden = false;
  while (current && current !== root) {
    if (current instanceof SVGElement || current.localName === 'title') return false;
    if (current.getAttribute('aria-hidden') === 'true') return false;
    if (isVisuallyHidden(current)) visuallyHidden = true;
    current = current.parentElement;
  }
  return visuallyHidden;
}

function isInVisuallyHiddenSubtree(node: Element, root: HTMLElement): boolean {
  let current: Element | null = node;
  while (current && current !== root) {
    if (isVisuallyHidden(current)) return true;
    current = current.parentElement;
  }
  return false;
}

function isVisuallyHidden(element: Element): boolean {
  const style = getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return true;
  if (Number.parseFloat(style.opacity) <= 0.01) return true;
  if (element.classList.contains('sr-only')) return true;
  const rect = element.getBoundingClientRect();
  return rect.width <= 1 || rect.height <= 1;
}

function hitBelongsToControl(element: HTMLElement, top: Element | null): boolean {
  if (top && (top === element || element.contains(top))) return true;
  const inactive =
    (element instanceof HTMLButtonElement && element.disabled) ||
    element.getAttribute('aria-disabled') === 'true' ||
    getComputedStyle(element).pointerEvents === 'none';
  if (!inactive || !top) return false;
  const parent = element.parentElement;
  if (!parent?.contains(top)) return false;
  const topControl = top.closest(CONTROL_SELECTOR);
  return topControl === null || topControl === element;
}
