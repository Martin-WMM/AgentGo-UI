import {
  type AgentEventHandler,
  type AgentStreamEnvelope,
  type AgentTurnVo,
  emptyAgentTurnVo,
  resolveEventName,
} from './types';

/**
 * Routes agent SSE envelopes to registered handlers by event name.
 * Unknown events leave the turn unchanged so the chat view stays stable.
 */
export class AgentEventDispatcher {
  private readonly handlers = new Map<string, AgentEventHandler>();

  /**
   * Registers or replaces a handler for its `eventName`.
   *
   * @param handler event converter
   * @returns this dispatcher for chaining
   */
  register(handler: AgentEventHandler): this {
    this.handlers.set(handler.eventName, handler);
    return this;
  }

  /**
   * Applies one envelope to a turn VO.
   *
   * @param turn current turn
   * @param envelope decoded SSE payload
   * @return updated turn
   */
  dispatch(turn: AgentTurnVo, envelope: AgentStreamEnvelope): AgentTurnVo {
    const name = resolveEventName(envelope);
    const handler = this.handlers.get(name);
    if (!handler) return turn;
    return handler.handle(envelope, turn);
  }
}

/** Creates a dispatcher with no handlers. */
export function createAgentEventDispatcher(): AgentEventDispatcher {
  return new AgentEventDispatcher();
}

/** Blank turn used while an agent run is in flight. */
export { emptyAgentTurnVo };
