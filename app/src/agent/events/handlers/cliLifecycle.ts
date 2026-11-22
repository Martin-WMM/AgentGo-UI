import { AGENT_EVENT, type AgentEventHandler } from '../types';
import { applyToolActivityEvent } from './toolActivity';
import { advancePlanStepFromPhase } from './toolLifecycle';

/**
 * Records CLI lifecycle activity (Bash / shell) and keeps plan-step progression
 * aligned with tool events.
 */
export const cliLifecycleHandler: AgentEventHandler = {
  eventName: AGENT_EVENT.cli,
  handle(envelope, turn) {
    const withActivity = applyToolActivityEvent(envelope, turn, 'cli');
    return advancePlanStepFromPhase(withActivity, envelope.data?.phase ?? '');
  },
};
