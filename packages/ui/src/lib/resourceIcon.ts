/**
 * Shared icon reference for AgentGo resources.
 *
 * ICONIFY stores an Iconify id such as `lucide:bot`. URL stores an absolute
 * http or https image address. Keep this aligned with `ResourceIcons` in AgentGo Backend.
 */
export type IconSource = 'ICONIFY' | 'URL';

export interface ResourceIconValue {
  source: IconSource;
  value: string;
}

const ICONIFY_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:[-_:][a-z0-9]+)*$/;
const ICONIFY_MAX_LENGTH = 100;
const URL_MAX_LENGTH = 2048;

/** Returns whether [icon] is a usable Iconify id or absolute http(s) URL. */
export function isResourceIcon(
  icon: ResourceIconValue | null | undefined,
): icon is ResourceIconValue {
  if (!icon) return false;
  const value = icon.value.trim();
  if (!value) return false;
  if (icon.source === 'ICONIFY') {
    return value.length <= ICONIFY_MAX_LENGTH && ICONIFY_ID.test(value);
  }
  if (icon.source !== 'URL' || value.length > URL_MAX_LENGTH) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
