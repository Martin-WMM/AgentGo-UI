import type { A2aAgentStatus } from '../composables/useA2aAgents';

/** Visual treatment for an A2A agent status on a card. */
export interface A2aPresentation {
  color: string;
  icon: string;
}

const presentations: Record<A2aAgentStatus, A2aPresentation> = {
  AVAILABLE: { color: '#059669', icon: 'lucide:bot' },
  UNAVAILABLE: { color: '#64748b', icon: 'lucide:bot-off' },
  ERROR: { color: '#dc2626', icon: 'lucide:triangle-alert' },
  UNKNOWN: { color: '#7c3aed', icon: 'lucide:bot' },
};

/**
 * Returns the icon and accent color used to present an A2A agent status.
 *
 * @param status operator status
 * @returns presentation tokens for cards and badges
 */
export function a2aPresentation(status: A2aAgentStatus): A2aPresentation {
  return presentations[status];
}
