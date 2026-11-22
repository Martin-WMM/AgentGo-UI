import type {
  AgentStreamEnvelope,
  AgentTurnVo,
  ToolActivityKind,
  ToolActivityStatus,
  ToolActivityVo,
} from '../types';

/**
 * Maps a tool / CLI lifecycle phase onto the chat activity status.
 *
 * @param phase wire phase from the SSE payload
 * @returns UI status, or null when the phase should be ignored
 */
export function mapToolActivityStatus(phase: string): ToolActivityStatus | null {
  if (phase === 'STARTED') return 'started';
  if (phase === 'RUNNING') return 'running';
  if (phase === 'COMPLETED' || phase === 'SUCCEEDED') return 'succeeded';
  if (phase === 'FAILED') return 'failed';
  return null;
}

/**
 * Upserts one tool / CLI activity into the turn VO.
 *
 * @param turn current turn
 * @param kind tool or cli
 * @param name tool name from the wire event
 * @param status lifecycle status
 * @param input optional command / script preview
 * @param summary optional result / error text
 * @returns updated turn
 */
export function upsertToolActivity(
  turn: AgentTurnVo,
  kind: ToolActivityKind,
  name: string,
  status: ToolActivityStatus,
  input?: string,
  summary?: string,
): AgentTurnVo {
  const trimmedName = name.trim() || 'tool';
  const activities = [...turn.toolActivities];
  const existingIndex = activities.findIndex((item) => item.name === trimmedName);
  const previous = existingIndex >= 0 ? activities[existingIndex] : undefined;
  const next: ToolActivityVo = {
    id: previous?.id ?? `tool-${trimmedName}-${activities.length + 1}`,
    kind: kind === 'cli' || previous?.kind === 'cli' ? 'cli' : 'tool',
    name: trimmedName,
    status,
    input: input?.trim() || previous?.input,
    summary: summary?.trim() || previous?.summary,
  };
  if (existingIndex >= 0) {
    activities[existingIndex] = next;
  } else {
    activities.push(next);
  }
  return { ...turn, toolActivities: activities };
}

/**
 * Applies a tool or CLI lifecycle envelope onto the turn's activity list.
 *
 * STARTED/RUNNING content is treated as the command input preview.
 * SUCCEEDED/FAILED content is treated as the result summary.
 *
 * @param envelope SSE envelope
 * @param turn current turn
 * @param kind tool or cli
 * @returns updated turn
 */
export function applyToolActivityEvent(
  envelope: AgentStreamEnvelope,
  turn: AgentTurnVo,
  kind: ToolActivityKind,
): AgentTurnVo {
  const phase = envelope.data?.phase ?? '';
  const status = mapToolActivityStatus(phase);
  if (!status) return turn;
  const name = envelope.data?.toolName?.trim() || 'tool';
  const content = envelope.data?.content;
  const input = status === 'started' || status === 'running' ? content : undefined;
  const summary = status === 'succeeded' || status === 'failed' ? content : undefined;
  return upsertToolActivity(turn, kind, name, status, input, summary);
}
