<script setup lang="ts">
import { toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useComposerVoiceInput } from '../composables/useComposerVoiceInput';
import { useWorkspaces } from '../composables/useWorkspaces';
import { DEFAULT_WORKSPACE_COLOR } from '../lib/workspaceColors';

const props = defineProps<{
  /** Current composer draft text. */
  modelValue: string;
  /** Prefer uploading into this workspace when set. */
  workspaceId?: string | null;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t, locale } = useI18n();
const { workspaces, createWorkspace, uploadFile } = useWorkspaces();
const attachInput = ref<HTMLInputElement | null>(null);
const attaching = ref(false);

const { listening, toggle: toggleVoice } = useComposerVoiceInput({
  locale: () => locale.value,
  appendText: (chunk) => {
    const current = props.modelValue.trim();
    emit('update:modelValue', current ? `${current} ${chunk}` : chunk);
  },
  onUnsupported: () => toastError(t('home.voiceUnsupported'), t('toast.error')),
  onError: () => toastError(t('home.voiceError'), t('toast.error')),
});

const voiceLabel = computed(() => (listening.value ? t('home.voiceStop') : t('home.voice')));

function openAttachPicker() {
  if (props.disabled || attaching.value) return;
  attachInput.value?.click();
}

async function resolveUploadWorkspaceId() {
  if (props.workspaceId) return props.workspaceId;
  const existing = workspaces.value.find(
    (workspace) => workspace.name === t('home.uploadsWorkspace'),
  );
  if (existing) return existing.id;
  const created = await createWorkspace(
    t('home.uploadsWorkspace'),
    t('home.uploadsWorkspaceDescription'),
    DEFAULT_WORKSPACE_COLOR,
  );
  return created.id;
}

async function onAttachChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || props.disabled) return;

  attaching.value = true;
  try {
    const workspaceId = await resolveUploadWorkspaceId();
    await uploadFile(workspaceId, file);
    toastSuccess(t('home.attachSuccess', { name: file.name }), t('toast.success'));
  } catch {
    toastError(t('home.attachError'), t('toast.error'));
  } finally {
    attaching.value = false;
  }
}

function onVoiceClick() {
  if (props.disabled) return;
  toggleVoice();
}
</script>

<template>
  <div class="flex shrink-0 items-center gap-0.5">
    <button
      type="button"
      class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
      :aria-label="attaching ? t('home.attaching') : t('home.attach')"
      :disabled="disabled || attaching"
      @click="openAttachPicker"
    >
      <Icon
        :icon="attaching ? 'lucide:loader-circle' : 'lucide:paperclip'"
        width="18"
        height="18"
        aria-hidden="true"
        :class="attaching ? 'animate-spin' : undefined"
      />
    </button>
    <input
      ref="attachInput"
      type="file"
      class="sr-only"
      :disabled="disabled || attaching"
      @change="onAttachChange"
    />
    <button
      type="button"
      class="rounded-lg p-2 transition-colors hover:bg-accent disabled:opacity-40"
      :class="
        listening
          ? 'text-primary hover:text-primary'
          : 'text-muted-foreground hover:text-foreground'
      "
      :aria-label="voiceLabel"
      :aria-pressed="listening"
      :disabled="disabled"
      @click="onVoiceClick"
    >
      <Icon
        :icon="listening ? 'lucide:mic-off' : 'lucide:mic'"
        width="18"
        height="18"
        aria-hidden="true"
      />
    </button>
  </div>
</template>
