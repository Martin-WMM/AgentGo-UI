<script setup lang="ts">
import { Dialog } from '@agentgo/ui';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { mcpAuthTypes, type McpAuthType } from '../composables/useMcpServers';

const props = defineProps<{
  open: boolean;
  title: string;
  name: string;
  endpointUrl: string;
  authType: McpAuthType;
  authToken: string;
  authHeaderName: string;
  customHeaders: string;
  protocolVersion: string;
  enabled: boolean;
  description: string;
  saving?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
  'update:name': [value: string];
  'update:endpointUrl': [value: string];
  'update:authType': [value: McpAuthType];
  'update:authToken': [value: string];
  'update:authHeaderName': [value: string];
  'update:customHeaders': [value: string];
  'update:protocolVersion': [value: string];
  'update:enabled': [value: boolean];
  'update:description': [value: string];
  save: [];
}>();

const { t } = useI18n();
const fieldClass =
  'mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring';
const showAuthToken = computed(() => props.authType === 'BEARER' || props.authType === 'HEADER');
const showAuthHeaderName = computed(() => props.authType === 'HEADER');
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <form class="max-h-[80vh] overflow-y-auto pr-1" @submit.prevent="emit('save')">
      <h2 class="text-xl font-semibold">{{ title }}</h2>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('mcp.formHint') }}</p>
      <div class="mt-5 space-y-4">
        <label class="block text-sm font-medium">
          {{ t('mcp.name') }}
          <input
            :value="name"
            required
            maxlength="255"
            :class="fieldClass"
            @input="emit('update:name', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="block text-sm font-medium">
          {{ t('mcp.endpointUrl') }}
          <input
            :value="endpointUrl"
            required
            maxlength="2048"
            type="url"
            :placeholder="t('mcp.endpointUrlPlaceholder')"
            :class="fieldClass"
            @input="emit('update:endpointUrl', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block text-sm font-medium">
            {{ t('mcp.authType') }}
            <select
              :value="authType"
              :class="fieldClass"
              @change="
                emit('update:authType', ($event.target as HTMLSelectElement).value as McpAuthType)
              "
            >
              <option v-for="item in mcpAuthTypes" :key="item" :value="item">
                {{ t(`mcp.authTypes.${item}`) }}
              </option>
            </select>
          </label>
          <label class="block text-sm font-medium">
            {{ t('mcp.protocolVersion') }}
            <input
              :value="protocolVersion"
              maxlength="32"
              :placeholder="t('mcp.protocolVersionPlaceholder')"
              :class="fieldClass"
              @input="emit('update:protocolVersion', ($event.target as HTMLInputElement).value)"
            />
          </label>
        </div>
        <label v-if="showAuthHeaderName" class="block text-sm font-medium">
          {{ t('mcp.authHeaderName') }}
          <input
            :value="authHeaderName"
            maxlength="255"
            :placeholder="t('mcp.authHeaderNamePlaceholder')"
            :class="fieldClass"
            @input="emit('update:authHeaderName', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label v-if="showAuthToken" class="block text-sm font-medium">
          {{ t('mcp.authToken') }}
          <input
            :value="authToken"
            maxlength="4000"
            type="password"
            autocomplete="off"
            :class="fieldClass"
            @input="emit('update:authToken', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="block text-sm font-medium">
          {{ t('mcp.descriptionLabel') }}
          <textarea
            :value="description"
            maxlength="2000"
            rows="2"
            class="mt-2 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            @input="emit('update:description', ($event.target as HTMLTextAreaElement).value)"
          />
        </label>
        <label class="block text-sm font-medium">
          {{ t('mcp.customHeaders') }}
          <textarea
            :value="customHeaders"
            rows="4"
            spellcheck="false"
            class="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
            @input="emit('update:customHeaders', ($event.target as HTMLTextAreaElement).value)"
          />
        </label>
        <p class="text-xs text-muted-foreground">{{ t('mcp.customHeadersHint') }}</p>
        <label class="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            class="size-4 rounded border-input"
            :checked="enabled"
            @change="emit('update:enabled', ($event.target as HTMLInputElement).checked)"
          />
          {{ t('mcp.enabled') }}
        </label>
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <button
          class="rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent"
          type="button"
          @click="emit('update:open', false)"
        >
          {{ t('mcp.cancel') }}
        </button>
        <button
          class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          type="submit"
          :disabled="saving"
        >
          {{ saving ? t('mcp.saving') : t('mcp.save') }}
        </button>
      </div>
    </form>
  </Dialog>
</template>
