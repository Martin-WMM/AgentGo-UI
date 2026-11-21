<script setup lang="ts">
import { isResourceIcon, ResourceIcon, toastError, toastSuccess } from '@agentgo/ui';
import type { ResourceIconValue } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import ColorSwatchPicker from '../components/ColorSwatchPicker.vue';
import ContentSkeleton from '../components/ContentSkeleton.vue';
import MarkdownEditor from '../components/MarkdownEditor.vue';
import type { PromptEngine } from '../composables/usePromptTemplates';
import { promptFailureI18n, usePromptTemplates } from '../composables/usePromptTemplates';
import { DEFAULT_WORKSPACE_COLOR } from '../lib/workspaceColors';

const engines: PromptEngine[] = ['SIMPLE', 'JINJA2'];
const promptIcons = [
  'lucide:message-square',
  'lucide:bot',
  'lucide:sparkles',
  'lucide:file-text',
  'lucide:brain',
  'lucide:lightbulb',
  'lucide:book-open',
  'lucide:terminal',
] as const;
const tagMaxCount = 20;
const tagMaxLength = 32;

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { getTemplate, createTemplate, updateTemplate } = usePromptTemplates();

const saving = ref(false);
const loading = ref(false);
const loadFailed = ref(false);
const tagDraft = ref('');
const tagError = ref('');
const form = reactive({
  groupName: '',
  name: '',
  description: '',
  engine: 'SIMPLE' as PromptEngine,
  content: '',
  message: '',
  tags: [] as string[],
  color: DEFAULT_WORKSPACE_COLOR,
  icon: '',
});

const templateId = computed(() => {
  const raw = route.params.id;
  if (typeof raw !== 'string' || raw === 'new') return null;
  return raw;
});
const isCreate = computed(() => !templateId.value);
const pageTitle = computed(() =>
  t(isCreate.value ? 'prompts.createTemplate' : 'prompts.editTemplate'),
);
const resolvedIcon = computed((): ResourceIconValue | null => {
  const value = form.icon.trim();
  if (!value) return null;
  const icon: ResourceIconValue = {
    source: /^https?:\/\//i.test(value) ? 'URL' : 'ICONIFY',
    value,
  };
  return isResourceIcon(icon) ? icon : null;
});
const iconInvalid = computed(() => Boolean(form.icon.trim()) && !resolvedIcon.value);
const canSave = computed(
  () =>
    Boolean(form.groupName.trim() && form.name.trim() && form.content.trim()) &&
    (isCreate.value || Boolean(form.message.trim())) &&
    !iconInvalid.value &&
    !saving.value,
);

onMounted(async () => {
  if (!templateId.value) return;
  loading.value = true;
  try {
    const template = await getTemplate(templateId.value);
    form.groupName = template.groupName;
    form.name = template.name;
    form.description = template.description;
    form.engine = template.engine;
    form.content = template.content;
    form.tags = [...template.tags];
    form.color = template.color;
    form.icon = template.icon?.value ?? '';
    loadFailed.value = false;
  } catch (caught) {
    loadFailed.value = true;
    toastError(t(promptFailureI18n(caught)), t('toast.error'));
  } finally {
    loading.value = false;
  }
});

function goBack() {
  void router.push({ name: 'console-prompts' });
}

function hasControlCharacter(value: string) {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code <= 31 || code === 127) return true;
  }
  return false;
}

function addTag() {
  const tag = tagDraft.value.trim();
  tagError.value = '';
  if (!tag) return true;
  if (tag.includes(',') || hasControlCharacter(tag)) {
    tagError.value = t('prompts.tagInvalid');
    return false;
  }
  if (tag.length > tagMaxLength) {
    tagError.value = t('prompts.tagTooLong');
    return false;
  }
  if (form.tags.includes(tag)) {
    tagDraft.value = '';
    return true;
  }
  if (form.tags.length >= tagMaxCount) {
    tagError.value = t('prompts.tagLimit');
    return false;
  }
  form.tags.push(tag);
  tagDraft.value = '';
  return true;
}

function removeTag(tag: string) {
  form.tags = form.tags.filter((item) => item !== tag);
}

async function saveTemplate() {
  if (!addTag() || !canSave.value) return;
  saving.value = true;
  const input = {
    groupName: form.groupName,
    name: form.name,
    description: form.description,
    engine: form.engine,
    content: form.content,
    message: form.message,
    tags: [...form.tags],
    color: form.color,
    icon: resolvedIcon.value,
  };
  try {
    if (templateId.value) {
      await updateTemplate(templateId.value, input);
      toastSuccess(t('prompts.updated', { name: form.name.trim() }), t('toast.success'));
    } else {
      await createTemplate(input);
      toastSuccess(t('prompts.created', { name: form.name.trim() }), t('toast.success'));
    }
    goBack();
  } catch (caught) {
    toastError(t(promptFailureI18n(caught)), t('toast.error'));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section
    class="flex w-full min-w-0 max-w-full flex-col px-4 py-4 sm:px-6 lg:h-[calc(100dvh-11.75rem)] lg:min-h-[calc(100dvh-11.75rem)]"
  >
    <div class="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex min-w-0 items-center gap-3">
        <button
          type="button"
          class="rounded-xl border border-input p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          :aria-label="t('prompts.backToList')"
          @click="goBack"
        >
          <Icon icon="lucide:arrow-left" width="18" height="18" aria-hidden="true" />
        </button>
        <div class="min-w-0">
          <h1 class="truncate text-xl font-semibold tracking-tight sm:text-2xl">{{ pageTitle }}</h1>
          <p class="mt-0.5 truncate text-sm text-muted-foreground">
            {{ t('prompts.editorDescription') }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 self-end sm:self-auto">
        <button type="button" class="ag-btn ag-btn-ghost" @click="goBack">
          {{ t('prompts.cancel') }}
        </button>
        <button
          type="button"
          class="ag-btn text-white"
          :style="{ backgroundColor: form.color }"
          :disabled="!canSave || loading || loadFailed"
          @click="saveTemplate"
        >
          <Icon icon="lucide:save" width="16" height="16" aria-hidden="true" />
          {{ saving ? t('prompts.saving') : t('prompts.save') }}
        </button>
      </div>
    </div>

    <ContentSkeleton v-if="loading" kind="form" :label="t('prompts.loading')" />
    <div
      v-else-if="loadFailed"
      class="rounded-2xl border border-dashed border-input px-6 py-16 text-center"
    >
      <h2 class="text-lg font-semibold">{{ t('prompts.notFound') }}</h2>
      <button class="ag-btn ag-btn-info mt-5" type="button" @click="goBack">
        {{ t('prompts.backToList') }}
      </button>
    </div>
    <form
      v-else
      class="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]"
      @submit.prevent="saveTemplate"
    >
      <MarkdownEditor
        v-model="form.content"
        class="min-h-[32rem] lg:h-full lg:min-h-0"
        :label="t('prompts.content')"
        :placeholder="t('prompts.contentPlaceholder')"
        :empty-text="t('prompts.markdownPreviewEmpty')"
        highlight-placeholders
      />

      <aside class="min-h-0 space-y-4 overflow-y-auto rounded-2xl border border-input bg-card p-4">
        <h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {{ t('prompts.basicInfo') }}
        </h2>
        <label class="block text-sm font-medium">
          {{ t('prompts.name') }}
          <input
            v-model="form.name"
            required
            maxlength="255"
            class="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            :placeholder="t('prompts.namePlaceholder')"
          />
        </label>
        <label class="block text-sm font-medium">
          {{ t('prompts.group') }}
          <input
            v-model="form.groupName"
            required
            maxlength="255"
            class="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            :placeholder="t('prompts.groupPlaceholder')"
          />
        </label>
        <label class="block text-sm font-medium">
          {{ t('prompts.engine') }}
          <select
            v-model="form.engine"
            class="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="item in engines" :key="item" :value="item">
              {{ t(`prompts.engines.${item}`) }}
            </option>
          </select>
          <span class="mt-1.5 block text-xs font-normal text-muted-foreground">
            {{ t(`prompts.engineHint.${form.engine}`) }}
          </span>
        </label>
        <label class="block text-sm font-medium">
          {{ t('prompts.descriptionLabel') }}
          <textarea
            v-model="form.description"
            maxlength="2000"
            rows="3"
            class="mt-1.5 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            :placeholder="t('prompts.descriptionPlaceholder')"
          />
        </label>
        <div>
          <label class="block text-sm font-medium" for="prompt-tag-input">
            {{ t('prompts.tags') }}
          </label>
          <TransitionGroup
            v-if="form.tags.length"
            name="ag-chip"
            tag="div"
            class="relative mt-2 flex flex-wrap gap-1.5"
          >
            <span
              v-for="tag in form.tags"
              :key="tag"
              class="ag-tag"
              :style="{ '--ag-tag': form.color }"
            >
              <span class="max-w-40 truncate">{{ tag }}</span>
              <button
                type="button"
                class="rounded-full p-0.5 transition-transform hover:scale-110"
                :aria-label="t('prompts.removeTag', { tag })"
                @click="removeTag(tag)"
              >
                <Icon icon="lucide:x" width="12" height="12" aria-hidden="true" />
              </button>
            </span>
          </TransitionGroup>
          <input
            id="prompt-tag-input"
            v-model="tagDraft"
            maxlength="32"
            class="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            :placeholder="t('prompts.tagsPlaceholder')"
            @keydown.enter.prevent="addTag"
            @keydown.,.prevent="addTag"
            @blur="addTag"
          />
          <p class="mt-1.5 text-xs text-muted-foreground">{{ t('prompts.tagsHint') }}</p>
          <p v-if="tagError" class="mt-1 text-xs text-destructive">{{ tagError }}</p>
        </div>
        <ColorSwatchPicker v-model="form.color" :legend="t('prompts.color')" name="prompt-color" />
        <div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-medium">{{ t('prompts.icon') }}</span>
            <ResourceIcon v-if="resolvedIcon" :icon="resolvedIcon" :size="18" />
          </div>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              class="rounded-lg border px-2.5 py-1.5 text-xs"
              :class="
                form.icon.trim()
                  ? 'border-input text-muted-foreground hover:bg-accent'
                  : 'border-primary bg-primary/10 text-foreground'
              "
              :aria-pressed="!form.icon.trim()"
              @click="form.icon = ''"
            >
              {{ t('prompts.iconNone') }}
            </button>
            <button
              v-for="iconId in promptIcons"
              :key="iconId"
              type="button"
              class="flex size-8 items-center justify-center rounded-lg border"
              :class="
                form.icon.trim() === iconId
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-input text-muted-foreground hover:bg-accent hover:text-foreground'
              "
              :aria-pressed="form.icon.trim() === iconId"
              :aria-label="iconId"
              @click="form.icon = iconId"
            >
              <Icon :icon="iconId" width="16" height="16" aria-hidden="true" />
            </button>
          </div>
          <input
            v-model="form.icon"
            maxlength="2048"
            class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            :placeholder="t('prompts.iconPlaceholder')"
            :aria-invalid="iconInvalid"
          />
          <p class="mt-1.5 text-xs text-muted-foreground">{{ t('prompts.iconHint') }}</p>
          <p v-if="iconInvalid" class="mt-1 text-xs text-destructive">
            {{ t('prompts.iconInvalid') }}
          </p>
        </div>
        <label class="block text-sm font-medium">
          {{ t('prompts.message') }}
          <textarea
            v-model="form.message"
            :required="!isCreate"
            maxlength="2000"
            rows="2"
            class="mt-1.5 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            :placeholder="t('prompts.messagePlaceholder')"
          />
          <span class="mt-1.5 block text-xs font-normal text-muted-foreground">
            {{ t(isCreate ? 'prompts.messageHintCreate' : 'prompts.messageHintEdit') }}
          </span>
        </label>
      </aside>
    </form>
  </section>
</template>
