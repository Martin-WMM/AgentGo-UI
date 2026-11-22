import { AGENT_EVENT, type AgentEventHandler, type AgentTurnVo } from '../types';
import { applyToolActivityEvent } from './toolActivity';

/** Records tool lifecycle activity and advances the active plan step. */
export const toolLifecycleHandler: AgentEventHandler = {
  eventName: AGENT_EVENT.tool,
  handle(envelope, turn): AgentTurnVo {
    const withActivity = applyToolActivityEvent(envelope, turn, 'tool');
    return advancePlanStepFromPhase(withActivity, envelope.data?.phase ?? '');
  },
};

/**
 * Advances the active plan step from a tool / CLI lifecycle phase.
 *
 * @param turn current turn
 * @param phase wire phase
 * @returns updated turn
 */
export function advancePlanStepFromPhase(turn: AgentTurnVo, phase: string): AgentTurnVo {
  if (!phase || turn.planSteps.length === 0) return turn;

  const runningIndex = turn.planSteps.findIndex((step) => step.status === 'running');
  const targetIndex =
    runningIndex >= 0 ? runningIndex : turn.planSteps.findIndex((step) => step.status === 'ready');
  if (targetIndex < 0) return turn;

  let status = turn.planSteps[targetIndex]!.status;
  if (phase === 'STARTED' || phase === 'RUNNING') status = 'running';
  else if (phase === 'COMPLETED' || phase === 'SUCCEEDED') status = 'succeeded';
  else if (phase === 'FAILED') status = 'failed';
  else if (phase === 'SKIPPED') status = 'skipped';
  else return turn;

  return {
    ...turn,
    planSteps: turn.planSteps.map((step, index) =>
      index === targetIndex ? { ...step, status } : step,
    ),
  };
}
