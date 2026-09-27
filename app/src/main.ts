import { createApp } from 'vue';

import '@agentgo/ui/styles.css';
import App from './App.vue';
import { i18n } from './i18n';
import { router } from './router';
import { createPinia } from 'pinia';

// Mount immediately so a slow/unavailable auth service cannot leave the browser
// showing a completely blank document. Authentication is handled by the router
// guard, which can redirect after the shell is already visible.
createApp(App).use(createPinia()).use(i18n).use(router).mount('#app');
