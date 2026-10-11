<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { Dialog } from '@agentgo/ui';
import { useI18n } from 'vue-i18n';

import { workspaceColors } from '../lib/workspaceColors';

defineProps<{
  open: boolean;
  title: string;
  name: string;
  description: string;
  color: string;
  saving?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
  'update:name': [value: string];
  'update:description': [value: string];
  'update:color': [value: string];
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
        <fieldset>
          <legend class="text-sm font-medium">{{ t('files.workspaceColor') }}</legend>
          <div class="mt-3 flex flex-wrap gap-2.5" role="presentation">
            <label
              v-for="swatch in workspaceColors"
              :key="swatch.id"
              class="relative cursor-pointer"
            >
              <input
                class="peer sr-only"
                type="radio"
                name="workspace-color"
                :value="swatch.value"
                :checked="color === swatch.value"
                @change="emit('update:color', swatch.value)"
              />
              <span
                class="flex size-9 items-center justify-center rounded-full text-white shadow-sm peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring"
                :class="color === swatch.value ? 'outline outline-2 outline-offset-2' : ''"
                :style="{ backgroundColor: swatch.value, outlineColor: swatch.value }"
              >
                <Icon
                  v-if="color === swatch.value"
                  icon="lucide:check"
                  width="16"
                  height="16"
                  aria-hidden="true"
                />
              </span>
              <span class="sr-only">{{ t(swatch.labelKey) }}</span>
            </label>
          </div>
        </fieldset>
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
          class="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          :style="{ backgroundColor: color }"
          :disabled="saving"
        >
          {{ t('files.save') }}
        </button>
      </div>
    </form>
  </Dialog>
</template>
