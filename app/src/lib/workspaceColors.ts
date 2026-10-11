/**
 * Accent palette for file workspaces.
 *
 * Hex values must stay aligned with `WorkspaceColors` in AgentGo-backend.
 */
export const DEFAULT_WORKSPACE_COLOR = '#1D4ED8';

export const workspaceColors = [
  { id: 'blue', value: '#1D4ED8', labelKey: 'files.colors.blue' },
  { id: 'cyan', value: '#0E7490', labelKey: 'files.colors.cyan' },
  { id: 'teal', value: '#0F766E', labelKey: 'files.colors.teal' },
  { id: 'green', value: '#15803D', labelKey: 'files.colors.green' },
  { id: 'amber', value: '#B45309', labelKey: 'files.colors.amber' },
  { id: 'orange', value: '#C2410C', labelKey: 'files.colors.orange' },
  { id: 'red', value: '#B91C1C', labelKey: 'files.colors.red' },
  { id: 'pink', value: '#BE185D', labelKey: 'files.colors.pink' },
  { id: 'violet', value: '#6D28D9', labelKey: 'files.colors.violet' },
  { id: 'indigo', value: '#4338CA', labelKey: 'files.colors.indigo' },
] as const;

const palette = new Set<string>(workspaceColors.map((swatch) => swatch.value.toUpperCase()));

export function normalizeWorkspaceColor(color: string | null | undefined) {
  const normalized = color?.trim().toUpperCase();
  if (normalized && palette.has(normalized)) return normalized;
  return DEFAULT_WORKSPACE_COLOR;
}
