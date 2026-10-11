<script setup lang="ts">
import { toastError, toastSuccess } from '@agentgo/ui';
import { Icon } from '@iconify/vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { useWorkspaces } from '../composables/useWorkspaces';
import { DEFAULT_WORKSPACE_COLOR } from '../lib/workspaceColors';

const { t, tm } = useI18n();
const router = useRouter();
const { workspaces, createWorkspace, uploadFile } = useWorkspaces();
const message = ref('');
const attachInput = ref<HTMLInputElement | null>(null);
const attaching = ref(false);
const suggestions = computed(() => tm('home.suggestions') as string[]);

function startConversation(prompt = message.value) {
  if (!prompt.trim()) return;
  router.push({ name: 'chat', query: { prompt: prompt.trim() } });
}

function openAttachPicker() {
  if (attaching.value) return;
  attachInput.value?.click();
}

async function ensureUploadsWorkspace() {
  const existing = workspaces.value.find(
    (workspace) => workspace.name === t('home.uploadsWorkspace'),
  );
  if (existing) return existing;
  return createWorkspace(
    t('home.uploadsWorkspace'),
    t('home.uploadsWorkspaceDescription'),
    DEFAULT_WORKSPACE_COLOR,
  );
}

            <input ref="attachInput" type="file" class="sr-only" @change="onAttachChange" />
            <button
              type="button"
              class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              :aria-label="t('home.voice')"
            >
              <Icon icon="lucide:mic" width="18" height="18" aria-hidden="true" />
            </button>
          </div>
          <button
            type="submit"
            class="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            :aria-label="t('home.send')"
            :disabled="!message.trim()"
          >
            <Icon icon="lucide:arrow-up" width="18" height="18" aria-hidden="true" />
          </button>
        </div>
      </form>

      <div class="mt-5 flex flex-wrap justify-center gap-2">
        <button
          v-for="suggestion in suggestions"
          :key="suggestion"
          type="button"
          class="rounded-full border border-input bg-background/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
          @click="startConversation(suggestion)"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>
  </section>
</template>
