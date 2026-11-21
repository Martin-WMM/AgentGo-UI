import { ref } from 'vue';

const STORAGE_KEY = 'agentgo-sidebar-collapsed';

const collapsed = ref(false);
const mobileOpen = ref(false);
let initialized = false;

function readCollapsed(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setCollapsed(next: boolean) {
  collapsed.value = next;
  localStorage.setItem(STORAGE_KEY, String(next));
}

export function useSidebar() {
  if (!initialized) {
    collapsed.value = readCollapsed();
    initialized = true;
  }

  function toggleCollapsed() {
    setCollapsed(!collapsed.value);
  }

  function openMobile() {
    mobileOpen.value = true;
  }

  function closeMobile() {
    mobileOpen.value = false;
  }

  return {
    collapsed,
    mobileOpen,
    setCollapsed,
    toggleCollapsed,
    openMobile,
    closeMobile,
  };
}
