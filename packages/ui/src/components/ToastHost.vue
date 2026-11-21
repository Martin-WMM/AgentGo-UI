<script setup lang="ts">
import { dismissToast, useToasts, type ToastVariant } from '../lib/toast';

const props = withDefaults(
  defineProps<{
    /** Accessible label for the dismiss control on each toast. */
    dismissLabel?: string;
    /** Accessible label for the live region that announces toasts. */
    regionLabel?: string;
  }>(),
  {
    dismissLabel: 'Dismiss',
    regionLabel: 'Notifications',
  },
);

const toasts = useToasts();

function variantClass(variant: ToastVariant) {
  return `toast-item toast-item--${variant}`;
}
</script>

<template>
  <div
    class="toast-region"
    :aria-label="props.regionLabel"
    aria-live="polite"
    aria-relevant="additions text"
  >
    <TransitionGroup name="toast-slide" tag="div" class="toast-stack">
      <article
        v-for="item in toasts"
        :key="item.id"
        :class="variantClass(item.variant)"
        role="status"
      >
        <span class="toast-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <template v-if="item.variant === 'warning'">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3.5 21 19.5H3L12 3.5Z" />
              <path stroke-linecap="round" d="M12 9.5v4.5m0 3h.01" />
            </template>
            <template v-else>
              <circle cx="12" cy="12" r="9" />
              <path
                v-if="item.variant === 'success'"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m9 12 2 2 4-4"
              />
              <path
                v-else-if="item.variant === 'error'"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m9.5 9.5 5 5m0-5-5 5"
              />
              <path v-else stroke-linecap="round" stroke-linejoin="round" d="M12 8v4.5m0 3.5h.01" />
            </template>
          </svg>
        </span>
        <div class="toast-body">
          <p v-if="item.title" class="toast-title">{{ item.title }}</p>
          <p class="toast-message">{{ item.message }}</p>
        </div>
        <button
          type="button"
          class="toast-dismiss"
          :aria-label="props.dismissLabel"
          @click="dismissToast(item.id)"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </article>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-region {
  pointer-events: none;
  position: fixed;
  z-index: 60;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  width: min(100vw - 2rem, 22rem);
  flex-direction: column;
}

.toast-stack {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.toast-item {
  pointer-events: auto;
  display: grid;
  grid-template-columns: 1.35rem minmax(0, 1fr) 1.5rem;
  align-items: start;
  gap: 0.75rem;
  border: 1px solid transparent;
  border-radius: 0.95rem;
  padding: 0.85rem 0.9rem;
  color: var(--foreground);
  background: var(--card);
  box-shadow: 0 16px 36px -18px color-mix(in oklab, var(--foreground) 45%, transparent);
}

.toast-item--success {
  border-color: color-mix(in oklab, var(--success) 46%, var(--border));
  background: color-mix(in oklab, var(--success) 16%, var(--card));
}

.toast-item--error {
  border-color: color-mix(in oklab, var(--destructive) 46%, var(--border));
  background: color-mix(in oklab, var(--destructive) 16%, var(--card));
}

.toast-item--warning {
  border-color: color-mix(in oklab, var(--warning) 50%, var(--border));
  background: color-mix(in oklab, var(--warning) 18%, var(--card));
}

.toast-item--info {
  border-color: color-mix(in oklab, var(--info) 46%, var(--border));
  background: color-mix(in oklab, var(--info) 16%, var(--card));
}

.toast-item--success .toast-icon {
  color: var(--success);
}

.toast-item--error .toast-icon {
  color: var(--destructive);
}

.toast-item--warning .toast-icon {
  color: var(--warning);
}

.toast-item--info .toast-icon {
  color: var(--info);
}

.toast-icon {
  display: block;
  width: 1.35rem;
  height: 1.35rem;
  margin-top: 0.1rem;
  color: inherit;
}

.toast-icon svg,
.toast-dismiss svg {
  display: block;
  width: 100%;
  height: 100%;
}

.toast-body {
  min-width: 0;
}

.toast-title {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 650;
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: inherit;
}

.toast-message {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: inherit;
  opacity: 0.92;
}

.toast-title + .toast-message {
  margin-top: 0.2rem;
}

.toast-dismiss {
  display: inline-flex;
  width: 1.5rem;
  height: 1.5rem;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 0.45rem;
  padding: 0;
  color: inherit;
  opacity: 0.8;
  background: transparent;
  cursor: pointer;
}

.toast-dismiss:hover {
  opacity: 1;
  background: rgb(255 255 255 / 0.16);
}

.toast-slide-enter-active {
  transition:
    opacity 280ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-leave-active {
  position: absolute;
  width: min(100vw - 2rem, 22rem);
  transition:
    opacity 180ms ease-in,
    transform 180ms ease-in;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(1.75rem);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(1.25rem);
}

.toast-slide-move {
  transition: transform 220ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .toast-slide-enter-active,
  .toast-slide-leave-active,
  .toast-slide-move {
    transition-duration: 1ms;
  }
}
</style>
