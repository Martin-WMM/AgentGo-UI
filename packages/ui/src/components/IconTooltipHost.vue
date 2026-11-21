<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import { findIconButton, type IconTipTarget } from '../lib/iconTooltip';

const SHOW_DELAY_MS = 280;
const HIDE_DELAY_MS = 60;

const label = ref('');
const open = ref(false);
const placed = ref(false);
const top = ref(0);
const left = ref(0);
const tipRef = ref<HTMLElement | null>(null);

let anchor: HTMLElement | null = null;
let pending: HTMLElement | null = null;
let pendingLabel = '';
let showTimer = 0;
let hideTimer = 0;
let moveFrame = 0;
let watchFrame = 0;
let pointerInside = false;
let lastX = 0;
let lastY = 0;
const suppressedTitles = new Map<HTMLElement, string>();

function clearShowTimer() {
  if (!showTimer) return;
  window.clearTimeout(showTimer);
  showTimer = 0;
}

function clearHideTimer() {
  if (!hideTimer) return;
  window.clearTimeout(hideTimer);
  hideTimer = 0;
}

function suppressTitle(element: HTMLElement) {
  const current = element.getAttribute('title');
  if (current != null && !suppressedTitles.has(element)) suppressedTitles.set(element, current);
  if (element.hasAttribute('title')) element.removeAttribute('title');
}

function restoreTitle(element: HTMLElement) {
  const title = suppressedTitles.get(element);
  if (title == null) return;
  suppressedTitles.delete(element);
  if (element.isConnected && !element.hasAttribute('title')) element.setAttribute('title', title);
}

function restoreAllTitles() {
  for (const element of [...suppressedTitles.keys()]) restoreTitle(element);
}

function stopWatching() {
  if (!watchFrame) return;
  window.cancelAnimationFrame(watchFrame);
  watchFrame = 0;
}

function hideNow() {
  clearShowTimer();
  clearHideTimer();
  stopWatching();
  pending = null;
  pendingLabel = '';
  restoreAllTitles();
  anchor = null;
  open.value = false;
  placed.value = false;
}

function scheduleHide() {
  pending = null;
  pendingLabel = '';
  clearShowTimer();
  if (!open.value) {
    restoreAllTitles();
    anchor = null;
    return;
  }
  if (hideTimer) return;
  hideTimer = window.setTimeout(hideNow, HIDE_DELAY_MS);
}

function measure(element: HTMLElement, tip: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  const gap = 8;
  let nextTop = rect.top - tipRect.height - gap;
  if (nextTop < gap) nextTop = rect.bottom + gap;
  if (nextTop + tipRect.height > window.innerHeight - gap) {
    nextTop = Math.max(gap, window.innerHeight - tipRect.height - gap);
  }
  let nextLeft = rect.left + rect.width / 2 - tipRect.width / 2;
  const maxLeft = Math.max(gap, window.innerWidth - tipRect.width - gap);
  nextLeft = Math.min(Math.max(gap, nextLeft), maxLeft);
  return { top: Math.round(nextTop), left: Math.round(nextLeft) };
}

async function place(element: HTMLElement) {
  await nextTick();
  const tip = tipRef.value;
  if (!tip || anchor !== element) return;
  const next = measure(element, tip);
  top.value = next.top;
  left.value = next.left;
  if (placed.value) return;
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
  if (anchor === element) placed.value = true;
}

function watchAnchor() {
  watchFrame = window.requestAnimationFrame(() => {
    watchFrame = 0;
    if (!open.value || !anchor) return;
    if (!anchor.isConnected) {
      hideNow();
      return;
    }
    suppressTitle(anchor);
    watchAnchor();
  });
}

function show(target: IconTipTarget, immediate: boolean) {
  clearHideTimer();
  if (anchor === target.element && open.value && label.value === target.label) {
    suppressTitle(target.element);
    if (immediate) void place(target.element);
    return;
  }
  if (pending === target.element && pendingLabel === target.label) return;
  pending = target.element;
  pendingLabel = target.label;
  const delay = immediate || open.value ? 0 : SHOW_DELAY_MS;
  clearShowTimer();
  showTimer = window.setTimeout(() => {
    showTimer = 0;
    if (pending !== target.element || !target.element.isConnected) return;
    if (anchor && anchor !== target.element) restoreTitle(anchor);
    anchor = target.element;
    label.value = target.label;
    pending = null;
    pendingLabel = '';
    suppressTitle(target.element);
