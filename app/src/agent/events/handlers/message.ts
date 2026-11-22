import { AGENT_EVENT, type AgentEventHandler, type AgentTurnVo, type PlanStepVo } from '../types';

/**
 * Parses plan text into ordered steps.
 * Prefers structured plan JSON; then numbered / bulleted lists; otherwise one step.
 */
export function parsePlanSteps(planText: string): PlanStepVo[] {
  const trimmed = planText.trim();
  if (!trimmed) return [];

  const fromJson = parseJsonPlan(trimmed);
  if (fromJson) return fromJson;

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const listItems = lines
    .map((line) => {
      const match = line.match(/^(\d+[.)]\s+|[-*•]\s+)(.+)$/);
      return match?.[2]?.trim() ?? '';
    })
    .filter((line) => line.length > 0);

  // Only promote list syntax when every non-empty line is a list item.
  // Multi-line essays must not become dozens of checklist rows.
  const texts = listItems.length >= 1 && listItems.length === lines.length ? listItems : [trimmed];

  return texts.map((text, index) => toStep(index + 1, text));
}

function parseJsonPlan(planText: string): PlanStepVo[] | null {
  const payload = extractJsonObject(planText);
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload) as {
      steps?: Array<{ id?: number; title?: string; name?: string; instruction?: string }>;
    };
    if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) return null;
    return parsed.steps.map((step, index) => {
      const text = (step.title || step.name || step.instruction || `Step ${index + 1}`).trim();
      return toStep(typeof step.id === 'number' && step.id > 0 ? step.id : index + 1, text);
    });
  } catch {
    return null;
  }
}

function extractJsonObject(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const body = fenced && fenced.length > 0 ? fenced : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  return body.slice(start, end + 1);
}

function toStep(index: number, text: string): PlanStepVo {
  return {
    id: `plan-${index}`,
    index,
    text,
    status: 'ready',
  };
}

/** Captures plan steps and appends streamed answer deltas. */
export const messageHandler: AgentEventHandler = {
  eventName: AGENT_EVENT.message,
  handle(envelope, turn): AgentTurnVo {
    const data = envelope.data;
    if (!data) return turn;
    if (data.phase === 'ASSISTANT' && data.nodeId === 'plan' && data.content) {
      return {
        ...turn,
        planPreparing: false,
        planSteps: parsePlanSteps(data.content),
      };
    }
    if (data.phase === 'ASSISTANT_DELTA' && data.content) {
      return {
        ...turn,
        answer: {
          content: `${turn.answer.content}${data.content}`,
          final: false,
        },
      };
    }
    return turn;
  },
};
