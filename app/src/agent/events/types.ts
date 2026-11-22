/** SSE event names published by `POST /api/v1/agent/stream`. */
export const AGENT_EVENT = {
  agent: 'agent.lifecycle',
  node: 'node.lifecycle',
  message: 'message',
  tool: 'tool.lifecycle',
  cli: 'cli.lifecycle',
} as const;

export type AgentEventName = (typeof AGENT_EVENT)[keyof typeof AGENT_EVENT] | (string & {});

export interface AgentStreamPayload {
  kind: string;
  phase: string;
  threadId: string;
  nodeId?: string;
  content?: string;
  toolName?: string;
}

export interface AgentStreamEnvelope {
  eventId?: string;
  eventName?: string;
  finished?: boolean;
  data?: AgentStreamPayload;
}

/** User-facing plan step status shown in the chat UI. */
export type PlanStepStatus =
  | 'preparing'
  | 'ready'
  | 'running'
  | 'succeeded'
  | 'skipped'
  | 'failed';

export interface PlanStepVo {
  id: string;
  index: number;
  text: string;
  status: PlanStepStatus;
}

export interface AnswerVo {
  content: string;
  final: boolean;
}

/** Whether the side effect is an ordinary tool or a CLI / Bash command. */
export type ToolActivityKind = 'tool' | 'cli';

/** Lifecycle status for one tool / CLI invocation shown in chat. */
export type ToolActivityStatus = 'started' | 'running' | 'succeeded' | 'failed';

/**
 * One tool or CLI execution observed during the turn.
 * Built from `tool.lifecycle` / `cli.lifecycle` SSE events.
 */
export interface ToolActivityVo {
  id: string;
  kind: ToolActivityKind;
  name: string;
  status: ToolActivityStatus;
  /** Command / script / source preview from the STARTED lifecycle event. */
  input?: string;
  /** Latest result / error summary from the runtime, when available. */
  summary?: string;
}

/**
 * View object for one assistant turn.
 * Handlers mutate this shape; the chat page only renders these fields.
 */
export interface AgentTurnVo {
  planPreparing: boolean;
  planSteps: PlanStepVo[];
  toolActivities: ToolActivityVo[];
  answer: AnswerVo;
  final: boolean;
  failed: boolean;
}

/** One registered converter from a wire event to turn VO updates. */
export interface AgentEventHandler {
  /** SSE / payload kind this handler owns. */
  readonly eventName: AgentEventName;
  handle(envelope: AgentStreamEnvelope, turn: AgentTurnVo): AgentTurnVo;
}

/** Blank turn used before the first event arrives. */
export function emptyAgentTurnVo(): AgentTurnVo {
  return {
    planPreparing: false,
    planSteps: [],
    toolActivities: [],
    answer: { content: '', final: false },
    final: false,
    failed: false,
  };
}

/** Resolves the wire event name from the SSE envelope. */
export function resolveEventName(envelope: AgentStreamEnvelope): string {
  return envelope.data?.kind || envelope.eventName || '';
}
