import { AGENT_EVENT, type AgentEventHandler, type AgentTurnVo } from '../types';

/** Marks the turn finished when the agent lifecycle ends. */
export const agentLifecycleHandler: AgentEventHandler = {
  eventName: AGENT_EVENT.agent,
  handle(envelope, turn): AgentTurnVo {
    const phase = envelope.data?.phase ?? '';
    if (phase !== 'COMPLETED' && phase !== 'FAILED') return turn;
    const failed = phase === 'FAILED';
    const content = envelope.data?.content?.trim() ?? '';
    return {
      ...turn,
      planPreparing: false,
      planSteps: turn.planSteps.map((step) =>
        step.status === 'running' || step.status === 'preparing' || step.status === 'ready'
          ? { ...step, status: failed ? 'failed' : 'succeeded' }
          : step,
      ),
      answer: {
        content: turn.answer.content || content,
        final: true,
      },
      final: true,
      failed,
    };
  },
};
