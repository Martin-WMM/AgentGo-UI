<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    closeOnOverlay?: boolean;
    closeOnEscape?: boolean;
  }>(),
  {
    closeOnOverlay: true,
    closeOnEscape: true,
  },
);

const emit = defineEmits<{ 'update:open': [open: boolean] }>();

function close() {
  emit('update:open', false);
}

function onKeydown(event: KeyboardEvent) {
  if (props.open && props.closeOnEscape && event.key === 'Escape') close();
}

onMounted(() => document.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown));
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog-backdrop">
      <div
        v-if="open"
        class="dialog-backdrop"
        @mousedown.self="closeOnOverlay && close()"
      >
        <Transition name="dialog-panel" appear>
          <section
            class="dialog-content"
            role="dialog"
            aria-modal="true"
          >
            <slot />
          </section>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  z-index: 50;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 1.5rem;
  background: rgb(0 0 0 / 0.58);
  backdrop-filter: blur(5px);
}
.dialog-content {
  box-sizing: border-box;
  width: min(100%, 30rem);
  max-height: calc(100vh - 3rem);
  overflow: auto;
  border: 1px solid hsl(var(--input));
  border-radius: 1rem;
  padding: 1.5rem;
  background: hsl(var(--background));
  box-shadow: 0 24px 60px rgb(0 0 0 / 0.36), 0 0 0 1px rgb(255 255 255 / 0.03) inset;
}
.dialog-backdrop-enter-active,
.dialog-backdrop-leave-active {
  transition: opacity 180ms ease;
}
.dialog-backdrop-enter-from,
.dialog-backdrop-leave-to {
  opacity: 0;
}
.dialog-panel-enter-active {
  transition:
    opacity 220ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}
.dialog-panel-leave-active {
  transition:
    opacity 140ms ease-in,
    transform 140ms ease-in;
}
.dialog-panel-enter-from,
.dialog-panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}
@media (prefers-reduced-motion: reduce) {
  .dialog-backdrop-enter-active,
  .dialog-backdrop-leave-active,
  .dialog-panel-enter-active,
  .dialog-panel-leave-active {
    transition-duration: 1ms;
  }
}
</style>
