import { ref } from 'vue';

import { FileRequestError, apiData } from '../api/fileRequest';

/** One global system event returned by the backend. */
export interface SystemEvent {
  id: string;
  name: string;
  domain: string;
  operator: string;
  comment: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export const EVENT_PAGE_SIZES = [10, 20, 50] as const;

interface SystemEventPage {
  data: SystemEvent[];
  pageSize: number;
  totalElements: number;
  totalPages: number;
  empty: boolean;
  first: boolean;
  last: boolean;
  size: number;
  number: number;
}

const events = ref<SystemEvent[]>([]);
const page = ref(1);
const pageSize = ref<number>(EVENT_PAGE_SIZES[1]);
const totalElements = ref(0);
const totalPages = ref(0);
const first = ref(true);
const last = ref(true);

/**
 * Loads and pages the global system-event log.
 *
 * @returns reactive page state and a refresh function
 */
export function useSystemEvents() {
  /**
   * Replaces the current page with one from the backend.
   *
   * @param nextPage one-based page number
   * @param nextSize page size
   */
  async function refreshEvents(nextPage = page.value, nextSize = pageSize.value) {
    const params = new URLSearchParams({
      page: String(nextPage),
      size: String(nextSize),
      sort: 'occurredAt',
      order: 'DESC',
    });
    const data = await apiData<SystemEventPage>(`/api/v1/systemEvents?${params.toString()}`);
    events.value = data.data.map((event) => ({ ...event, id: String(event.id) }));
    page.value = data.number;
    pageSize.value = data.pageSize;
    totalElements.value = data.totalElements;
    totalPages.value = data.totalPages;
    first.value = data.first;
    last.value = data.last;
  }

  return {
    events,
    page,
    pageSize,
    totalElements,
    totalPages,
    first,
    last,
    refreshEvents,
  };
}

/**
 * Maps a system-event request failure onto an i18n message key.
 *
 * @param caught error thrown by the API client
 * @returns message key under `events`
 */
export function eventFailureI18n(caught: unknown): string {
  if (caught instanceof FileRequestError && caught.status === 401) return 'events.authError';
  return 'events.loadError';
}
