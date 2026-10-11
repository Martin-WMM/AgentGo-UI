/** Locales supported by AgentGo UI and backend message bundles. */
export type AgentGoLocale = 'en' | 'zh-CN';

/**
 * Resolves the active UI locale for backend `Accept-Language` headers.
 *
 * Prefers the stored AgentGo locale, then the browser language, then English.
 */
export function currentAcceptLanguage(): AgentGoLocale {
  const stored = localStorage.getItem('agentgo-locale');
  if (stored === 'zh-CN' || stored === 'en') return stored;
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

/**
 * Builds headers for AgentGo Backend requests, always including `Accept-Language`.
 *
 * @param init optional extra headers from the caller
 * @returns merged headers with Accept-Language set from the active UI locale
 */
export function backendRequestHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  headers.set('Accept-Language', currentAcceptLanguage());
  return headers;
}
