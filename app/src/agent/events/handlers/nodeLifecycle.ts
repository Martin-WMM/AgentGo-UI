import {
  AGENT_EVENT,
  type AgentEventHandler,
  type AgentTurnVo,
  type PlanStepStatus,
} from '../types';

function markSteps(turn: AgentTurnVo, status: PlanStepStatus, onlyRunning = false): AgentTurnVo {
  return {
    ...turn,
    planSteps: turn.planSteps.map((step) => {
      if (onlyRunning && step.status !== 'running' && step.status !== 'ready') return step;
      if (!onlyRunning && (step.status === 'succeeded' || step.status === 'skipped' || step.status === 'failed')) {
        return step;
      }
      return { ...step, status };
    }),
  };
}

/** Folds node lifecycle into plan preparing / running / answer state. */
export const nodeLifecycleHandler: AgentEventHandler = {
  eventName: AGENT_EVENT.node,
  handle(envelope, turn): AgentTurnVo {
    const data = envelope.data;
    if (!data) return turn;
    const { nodeId, phase, content } = data;

    if (nodeId === 'plan') {
      if (phase === 'STARTED') {
        return { ...turn, planPreparing: true };
      }
      if (phase === 'COMPLETED' || phase === 'FAILED') {
        return { ...turn, planPreparing: false };
      }
    }

    if (nodeId === 'llm' || nodeId === 'execution') {
      if (phase === 'STARTED' || phase === 'RUNNING') {
        const next = markSteps(turn, 'running', true);
        if (next.planSteps.every((step) => step.status !== 'running') && next.planSteps.length > 0) {
          const firstReady = next.planSteps.findIndex((step) => step.status === 'ready');
          if (firstReady >= 0) {
            return {
              ...next,
              planSteps: next.planSteps.map((step, index) =>
                index === firstReady ? { ...step, status: 'running' } : step,
              ),
            };
          }
        }
        return next;
      }
      if (phase === 'COMPLETED' || phase === 'SUCCEEDED') {
        return markSteps(turn, 'succeeded', true);
      }
      if (phase === 'FAILED') {
        return markSteps(turn, 'failed', true);
      }
    }

    if (nodeId === 'output' && phase === 'COMPLETED' && content) {
      return {
        ...turn,
        planPreparing: false,
        planSteps: turn.planSteps.map((step) =>
          step.status === 'running' || step.status === 'ready' || step.status === 'preparing'
            ? { ...step, status: 'succeeded' }
            : step,
        ),
        // Prefer the already-streamed answer; fall back to the completed output payload.
        answer: {
          content: turn.answer.content || content,
          final: false,
        },
      };
    }

    return turn;
  },
};
