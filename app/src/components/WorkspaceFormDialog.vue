<script setup lang="ts">
import { Dialog } from '@agentgo/ui';
import { useI18n } from 'vue-i18n';

defineProps<{
  open: boolean;
  title: string;
  name: string;
  description: string;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
  'update:name': [value: string];
  'update:description': [value: string];
  save: [];
}>();

const { t } = useI18n();
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <form @submit.prevent="emit('save')">
      <h2 class="text-xl font-semibold">{{ title }}</h2>
      <div class="mt-5 space-y-4">
        <label class="block text-sm font-medium"
          >{{ t('files.workspaceName')
          }}<input
            :value="name"
            required
            maxlength="80"
            class="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            @input="emit('update:name', ($event.target as HTMLInputElement).value)"
        /></label>
        <label class="block text-sm font-medium"
          >{{ t('files.workspaceDescription')
          }}<textarea
            :value="description"
            maxlength="300"
            rows="3"
            class="mt-2 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            @input="emit('update:description', ($event.target as HTMLTextAreaElement).value)"
          />
        </label>
      </div>
      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm hover:bg-accent"
          @click="emit('update:open', false)"
        >
          {{ t('files.cancel') }}
        </button>
        <button
          type="submit"
          class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {{ t('files.save') }}
        </button>
      </div>
    </form>
  </Dialog>
</template>
