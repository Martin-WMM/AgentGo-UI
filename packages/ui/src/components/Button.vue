<script setup lang="ts">
import { computed, useAttrs, type ButtonHTMLAttributes } from 'vue';

import { cn } from '../lib/utils';

defineOptions({ inheritAttrs: false });

type ButtonVariant =
  'default' | 'info' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline' | 'ghost';

type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface Props extends /* @vue-ignore */ ButtonHTMLAttributes {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
});

const attrs = useAttrs();

const variantClass: Record<ButtonVariant, string> = {
  default: 'ag-btn-primary',
  info: 'ag-btn-info',
  success: 'ag-btn-success',
  warning: 'ag-btn-warning',
  destructive: 'ag-btn-danger',
  secondary: 'ag-btn-secondary',
  outline: 'ag-btn-outline',
  ghost: 'ag-btn-ghost',
};

const sizeClass: Record<ButtonSize, string> = {
  default: '',
  sm: 'ag-btn-sm',
  lg: 'ag-btn-lg',
  icon: 'ag-btn-icon',
};

const classes = computed(() =>
  cn('ag-btn', variantClass[props.variant], sizeClass[props.size], attrs.class as string),
);

const rest = computed(() => {
  const other = { ...attrs };
  delete other.class;
  return other;
});
</script>

<template>
  <button :class="classes" type="button" v-bind="rest">
    <slot />
  </button>
</template>
