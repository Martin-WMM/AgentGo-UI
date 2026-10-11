<script setup lang="ts">
import { toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import PromptMarkdownEditor from '../components/PromptMarkdownEditor.vue';
import type { PromptEngine } from '../composables/usePromptTemplates';
import { promptFailureI18n, usePromptTemplates } from '../composables/usePromptTemplates';

const engines: PromptEngine[] = ['SIMPLE', 'JINJA2'];

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { getTemplate, createTemplate, updateTemplate } = usePromptTemplates();

const saving = ref(false);
const loading = ref(false);
const loadFailed = ref(false);
const form = reactive({
  name: '',
  description: '',
  engine: 'SIMPLE' as PromptEngine,
  content: '',
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
const canSave = computed(() => Boolean(form.name.trim() && form.content.trim()) && !saving.value);

onMounted(async () => {
        </button>
      </div>
    </div>

    <p v-if="loading" class="text-sm text-muted-foreground">{{ t('prompts.loading') }}</p>
    <div
      v-else-if="loadFailed"
      class="rounded-2xl border border-dashed border-input px-6 py-16 text-center"
    >
      <h2 class="text-lg font-semibold">{{ t('prompts.notFound') }}</h2>
      <button
        class="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        type="button"
        @click="goBack"
      >
        {{ t('prompts.backToList') }}
      </button>
    </div>
    <form v-else class="space-y-6" @submit.prevent="saveTemplate">
      <div class="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/5 via-background to-cyan-400/5 p-5 sm:p-6">
        <h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {{ t('prompts.basicInfo') }}
        </h2>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <label class="block text-sm font-medium md:col-span-1">
            {{ t('prompts.name') }}
            <input
              v-model="form.name"
              required
              maxlength="255"
              class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              :placeholder="t('prompts.namePlaceholder')"
            />
          </label>
          <label class="block text-sm font-medium md:col-span-1">
            {{ t('prompts.engine') }}
            <select
              v-model="form.engine"
              class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="item in engines" :key="item" :value="item">
                {{ t(`prompts.engines.${item}`) }}
              </option>
            </select>
            <span class="mt-1.5 block text-xs font-normal text-muted-foreground">
              {{ t(`prompts.engineHint.${form.engine}`) }}
            </span>
          </label>
          <label class="block text-sm font-medium md:col-span-2">
            {{ t('prompts.descriptionLabel') }}
            <textarea
              v-model="form.description"
              maxlength="2000"
              rows="2"
              class="mt-2 w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              :placeholder="t('prompts.descriptionPlaceholder')"
            />
          </label>
        </div>
      </div>

      <PromptMarkdownEditor v-model="form.content" />
    </form>
  </section>
</template>
