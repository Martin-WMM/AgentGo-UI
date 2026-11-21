// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { findIconButton, iconTipLabel } from '../../packages/ui/src/lib/iconTooltip';

function rect(width: number, height: number, x = 0, y = 0): DOMRect {
  return {
    x,
    y,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    width,
    height,
    toJSON() {
      return {};
    },
  } as DOMRect;
}

function layout(element: Element, width: number, height: number, x = 0, y = 0) {
  element.getBoundingClientRect = () => rect(width, height, x, y);
}

function iconButton(label: string, x = 0) {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.innerHTML = '<svg aria-hidden="true" width="16" height="16"><title>eye</title></svg>';
  layout(button, 32, 32, x, 0);
  const svg = button.querySelector('svg');
  if (svg) layout(svg, 16, 16, x + 8, 8);
  document.body.append(button);
  return button;
}

describe('iconTipLabel', () => {
  it('uses the accessible name of an icon-only button and ignores icon titles', () => {
    const button = iconButton('View');
    expect(iconTipLabel(button)).toBe('View');
    button.remove();
  });

  it('skips buttons that already show a text label', () => {
    const button = document.createElement('button');
    button.innerHTML = '<svg width="16" height="16"></svg><span>Download</span>';
    layout(button, 96, 36);
    const span = button.querySelector('span');
    if (span) layout(span, 64, 16);
    const svg = button.querySelector('svg');
    if (svg) layout(svg, 16, 16);
    document.body.append(button);
    expect(iconTipLabel(button)).toBeNull();
    button.remove();
  });

  it('reads a visually hidden label when the icon has no aria-label', () => {
    const link = document.createElement('a');
    link.href = '/console/prompts';
    link.innerHTML =
      '<svg width="18" height="18"></svg><span class="ag-sidebar-label">Prompts</span>';
    layout(link, 40, 40);
    const svg = link.querySelector('svg');
    if (svg) layout(svg, 18, 18);
    const label = link.querySelector('span');
    if (label) {
      label.style.opacity = '0';
      layout(label, 0, 18);
    }
    document.body.append(link);
    expect(iconTipLabel(link)).toBe('Prompts');
    link.remove();
  });
});

describe('findIconButton', () => {
  it('returns the icon button under the pointer', () => {
    const view = iconButton('View', 10);
    const edit = iconButton('Edit', 50);
    document.elementFromPoint = (x) =>
      x < 40 ? view.querySelector('svg') : edit.querySelector('svg');
    expect(findIconButton(20, 10)?.label).toBe('View');
    expect(findIconButton(60, 10)?.label).toBe('Edit');
    view.remove();
    edit.remove();
  });

  it('still finds a disabled icon button when the hit target is its parent', () => {
    const wrap = document.createElement('div');
    const button = document.createElement('button');
    button.disabled = true;
    button.setAttribute('aria-label', 'Delete');
    button.innerHTML = '<svg width="16" height="16"></svg>';
    layout(button, 32, 32, 80, 0);
    const svg = button.querySelector('svg');
    if (svg) layout(svg, 16, 16, 88, 8);
    wrap.append(button);
    layout(wrap, 200, 40);
    document.body.append(wrap);
    document.elementFromPoint = () => wrap;
    expect(findIconButton(90, 10)?.label).toBe('Delete');
    wrap.remove();
  });
});
