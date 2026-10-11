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
  <div class="toast-region" :aria-label="props.regionLabel" aria-live="polite" aria-relevant="additions text">
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
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 3.5 21 19.5H3L12 3.5Z"
              />
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
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 8v4.5m0 3.5h.01"
              />
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </article>
