<script setup lang="ts">
import { parseJson, toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import ContentSkeleton from '../components/ContentSkeleton.vue';
import JsonEditor from '../components/JsonEditor.vue';
import {
  a2aAgentStatuses,
  a2aFailureI18n,
  useA2aAgents,
  type A2aAgentStatus,
} from '../composables/useA2aAgents';

const tagMaxCount = 16;
const tagMaxLength = 32;

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { getAgent, createAgent, updateAgent } = useA2aAgents();

const saving = ref(false);
const loading = ref(false);
const loadFailed = ref(false);
const tagDraft = ref('');
const tagError = ref('');
const descriptionVectorLength = ref(0);
const form = reactive({
  groupName: 'default',
  name: '',
  cardUrl: '',
  description: '',
  tags: [] as string[],
  metadata: '{}',
  enabled: true,
  status: 'UNKNOWN' as A2aAgentStatus,
});

const agentId = computed(() => {
  const raw = route.params.id;
  return typeof raw === 'string' ? raw : null;
});
const isCreate = computed(() => !agentId.value);
const pageTitle = computed(() => t(isCreate.value ? 'a2a.createAgent' : 'a2a.editAgent'));
const canSave = computed(
  () => Boolean(form.groupName.trim() && form.name.trim() && form.cardUrl.trim()) && !saving.value,
);

onMounted(async () => {
  if (!agentId.value) return;
  loading.value = true;
  try {
    const agent = await getAgent(agentId.value);
    form.groupName = agent.groupName;
    form.name = agent.name;
    form.cardUrl = agent.cardUrl;
    form.description = agent.description;
    form.tags = [...agent.tags];
    form.metadata = JSON.stringify(agent.metadata ?? {}, null, 2);
    form.enabled = agent.enabled;
    form.status = agent.status;
    descriptionVectorLength.value = agent.descriptionVector.length;
    loadFailed.value = false;
  } catch (caught) {
    loadFailed.value = true;
    toastError(t(a2aFailureI18n(caught, 'load')), t('toast.error'));
  } finally {
    loading.value = false;
  }
});

function goBack() {
  void router.push({ name: 'console-a2a' });
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
    tagError.value = t('a2a.tagInvalid');
    return false;
  }
  if (tag.length > tagMaxLength) {
    tagError.value = t('a2a.tagTooLong');
    return false;
  }
  if (form.tags.includes(tag)) {
    tagDraft.value = '';
    return true;
  }
  if (form.tags.length >= tagMaxCount) {
    tagError.value = t('a2a.tagLimit');
    return false;
  }
  form.tags.push(tag);
  tagDraft.value = '';
  return true;
}

function removeTag(tag: string) {
  form.tags = form.tags.filter((item) => item !== tag);
}

function parseMetadata(): Record<string, unknown> | null {
  const parsed = parseJson(form.metadata, 'object');
  if (
    !parsed.ok ||
    !parsed.value ||
    typeof parsed.value !== 'object' ||
    Array.isArray(parsed.value)
  ) {
    return null;
  }
  return parsed.value as Record<string, unknown>;
}

async function saveAgent() {
  if (!addTag() || !canSave.value) return;
  const metadata = parseMetadata();
  if (!metadata) {
    toastError(t('a2a.metadataInvalid'), t('toast.error'));
    return;
  }
  saving.value = true;
  const input = {
    groupName: form.groupName,
    name: form.name,
    cardUrl: form.cardUrl,
    description: form.description,
    tags: [...form.tags],
    metadata,
    enabled: form.enabled,
    status: form.status,
  };
  try {
    if (agentId.value) {
      await updateAgent(agentId.value, input);
      toastSuccess(t('a2a.updated', { name: form.name.trim() }), t('toast.success'));
