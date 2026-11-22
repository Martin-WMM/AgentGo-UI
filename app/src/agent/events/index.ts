import { AgentEventDispatcher, createAgentEventDispatcher, emptyAgentTurnVo } from './dispatcher';
import { agentLifecycleHandler } from './handlers/agentLifecycle';
import { cliLifecycleHandler } from './handlers/cliLifecycle';
import { messageHandler, parsePlanSteps } from './handlers/message';
import { nodeLifecycleHandler } from './handlers/nodeLifecycle';
import { toolLifecycleHandler } from './handlers/toolLifecycle';
import {
  AGENT_EVENT,
  type AgentStreamEnvelope,
  type AgentStreamPayload,
  type AgentTurnVo,
  emptyAgentTurnVo as blankTurn,
} from './types';

export {
  AGENT_EVENT,
  AgentEventDispatcher,
  createAgentEventDispatcher,
  emptyAgentTurnVo,
  parsePlanSteps,
  type AgentStreamEnvelope,
  type AgentStreamPayload,
  type AgentTurnVo,
};

/** Default dispatcher wired with the built-in SSE handlers. */
export function createDefaultAgentEventDispatcher(): AgentEventDispatcher {
  return createAgentEventDispatcher()
    .register(agentLifecycleHandler)
    .register(nodeLifecycleHandler)
    .register(messageHandler)
    .register(toolLifecycleHandler)
    .register(cliLifecycleHandler);
}

const defaultDispatcher = createDefaultAgentEventDispatcher();

/**
 * Folds one agent SSE envelope into the visible turn VO.
 * Chat views should call this instead of accumulating raw node activity.
 */
export function applyAgentStreamEvent(
  turn: AgentTurnVo,
  envelope: AgentStreamEnvelope,
): AgentTurnVo {
  return defaultDispatcher.dispatch(turn, envelope);
}

/** @deprecated Prefer {@link emptyAgentTurnVo}. */
export function emptyAgentTurn(): AgentTurnVo {
  return blankTurn();
}
