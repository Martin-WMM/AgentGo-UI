import { computed, ref, watch, type ComputedRef } from 'vue';

/**
 * Tracks which visible resource ids are selected for a batch action.
 *
 * Selection is limited to the ids currently shown. Filtering or paging drops ids that left the list.
 *
 * @param visibleIds identifiers of the rows or cards on screen
 */
export function useBatchSelection(visibleIds: ComputedRef<string[]>) {
  const selectedIds = ref<string[]>([]);

  watch(visibleIds, (ids) => {
    const allowed = new Set(ids);
    selectedIds.value = selectedIds.value.filter((id) => allowed.has(id));
  });

  const selectedSet = computed(() => new Set(selectedIds.value));
  const count = computed(() => selectedIds.value.length);
  const allSelected = computed(
    () => visibleIds.value.length > 0 && selectedIds.value.length === visibleIds.value.length,
  );

  function toggle(id: string) {
    selectedIds.value = selectedSet.value.has(id)
      ? selectedIds.value.filter((item) => item !== id)
      : [...selectedIds.value, id];
  }

  function toggleAll() {
    selectedIds.value = allSelected.value ? [] : [...visibleIds.value];
  }

  function clear() {
    selectedIds.value = [];
  }

  return { selectedIds, selectedSet, count, allSelected, toggle, toggleAll, clear };
}
