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
