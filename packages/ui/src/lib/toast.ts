import { readonly, ref } from 'vue';

/** Visual tone for a toast notification. */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

/** Payload accepted when pushing a toast. */
export interface ToastOptions {
  /** Optional short heading shown above the message. */
  title?: string;
  /** Primary notification body. */
  message: string;
  /** Success, error, warning, or info styling. Defaults to `info`. */
  variant?: ToastVariant;
  /** Auto-dismiss delay in milliseconds. Use `0` to keep until dismissed. */
  duration?: number;
}

/** Active toast entry rendered by `ToastHost`. */
export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

const DEFAULT_DURATION_MS = 4200;
const MAX_VISIBLE = 4;

const toasts = ref<ToastItem[]>([]);
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let sequence = 0;

function nextId(): string {
  sequence += 1;
  return `toast-${sequence}-${Date.now()}`;
}

function clearTimer(id: string) {
  const timer = timers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    timers.delete(id);
  }
}

/**
 * Dismisses a toast by id and cancels its auto-dismiss timer.
 *
 * @param id toast identifier returned by {@link toast}
 */
export function dismissToast(id: string) {
  clearTimer(id);
  toasts.value = toasts.value.filter((item) => item.id !== id);
}

/**
 * Pushes a short-lived notification into the global toast stack.
 *
 * @param options message and optional variant/title/duration
 * @returns toast id that can be dismissed manually
 */
export function toast(options: ToastOptions): string {
  const id = nextId();
  const item: ToastItem = {
    id,
    title: options.title?.trim() || undefined,
    message: options.message.trim(),
    variant: options.variant ?? 'info',
    duration: options.duration ?? DEFAULT_DURATION_MS,
  };

  toasts.value = [...toasts.value, item].slice(-MAX_VISIBLE);

  if (item.duration > 0) {
    timers.set(
      id,
      setTimeout(() => {
        dismissToast(id);
      }, item.duration),
    );
  }

  return id;
}

/** Convenience helper for a success toast. */
export function toastSuccess(message: string, title?: string) {
  return toast({ variant: 'success', message, title });
}

/** Convenience helper for an error toast. */
export function toastError(message: string, title?: string) {
  return toast({ variant: 'error', message, title });
}

/** Convenience helper for a warning toast. */
export function toastWarning(message: string, title?: string) {
  return toast({ variant: 'warning', message, title });
}

/**
 * Reactive list of currently visible toasts for `ToastHost`.
 *
 * @returns readonly ref of active toast items
 */
export function useToasts() {
  return readonly(toasts);
}
