import { createApp } from 'vue';

import '@agentgo/ui/styles.css';
import App from './App.vue';
import { i18n } from './i18n';
import { router } from './router';
import { createPinia } from 'pinia';

import { useSettingsStore } from './stores/settings';

// Mount immediately so a slow/unavailable auth service cannot leave the browser
// showing a completely blank document. Authentication is handled by the router
// guard, which can redirect after the shell is already visible.
const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
useSettingsStore().applyLocal();
app.use(i18n).use(router).mount('#app');
