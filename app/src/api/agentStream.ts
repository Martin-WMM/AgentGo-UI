import {
  AGENT_EVENT,
  applyAgentStreamEvent,
  emptyAgentTurnVo,
  type AgentStreamEnvelope,
  type AgentStreamPayload,
  type AgentTurnVo,
} from '../agent/events';
import { backendRequestHeaders } from './locale';
import { FileRequestError } from './fileRequest';
import { backendBaseUrl } from '../stores/auth';

export {
  AGENT_EVENT,
  applyAgentStreamEvent,
  emptyAgentTurnVo,
  type AgentStreamEnvelope,
  type AgentStreamPayload,
  type AgentTurnVo,
};

/** @deprecated Prefer {@link emptyAgentTurnVo}. */
export function emptyAgentTurn(): AgentTurnVo {
  return emptyAgentTurnVo();
}

export interface ParsedSseEvent {
  id?: string;
  event: string;
  data: string;
}

/**
 * Splits a text/event-stream buffer on blank lines.
 * The trailing incomplete frame is returned as `rest`.
 */
export function consumeSseBlocks(buffer: string): { blocks: string[]; rest: string } {
  const normalized = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const parts = normalized.split('\n\n');
  const rest = parts.pop() ?? '';
  return { blocks: parts.filter((part) => part.trim().length > 0), rest };
}

/** Parses one SSE frame. Comment-only frames return null. */
export function parseSseBlock(block: string): ParsedSseEvent | null {
  let event = 'message';
  let id: string | undefined;
  const dataLines: string[] = [];
  for (const line of block.split('\n')) {
    if (!line || line.startsWith(':')) continue;
    const separator = line.indexOf(':');
    const field = separator === -1 ? line : line.slice(0, separator);
    const raw = separator === -1 ? '' : line.slice(separator + 1);
    const value = raw.startsWith(' ') ? raw.slice(1) : raw;
    if (field === 'event') event = value;
    else if (field === 'id') id = value;
    else if (field === 'data') dataLines.push(value);
  }
  if (dataLines.length === 0) return null;
  return { id, event, data: dataLines.join('\n') };
}

/** Maps an HTTP failure from the agent stream onto a chat i18n key. */
export function agentStreamFailureI18n(caught: unknown): string {
  if (!(caught instanceof FileRequestError)) return 'chat.error';
  if (caught.status === 401) return 'chat.unauthorized';
  if (caught.status === 503 || caught.errorCode === 'AGENT-002') return 'chat.busy';
  if (caught.status === 400 || caught.errorCode === 'AGENT-001') return 'chat.invalid';
  return 'chat.error';
}

export interface AgentStreamRequest {
  threadId: string;
  sessionId?: number;
  input: string;
  /** Optional composer bindings forwarded as stream metadata. */
  bindings?: Record<string, string>;
  signal?: AbortSignal;
  onEvent: (envelope: AgentStreamEnvelope) => void;
}

/**
 * Posts one turn to the agent SSE endpoint and emits each decoded envelope.
 * EventSource cannot send a JSON body, so the stream is read from fetch.
 */
export async function streamAgent(request: AgentStreamRequest): Promise<void> {
  const headers = backendRequestHeaders();
  headers.set('Accept', 'text/event-stream');
  headers.set('Content-Type', 'application/json');
  const acceptLanguage = headers.get('Accept-Language') ?? 'en';
  const metadata: Record<string, string> = {
    source: 'ui',
    ...(request.bindings ?? {}),
  };
  if (request.sessionId != null) {
    metadata.sessionId = String(request.sessionId);
  }
  const response = await fetch(`${backendBaseUrl}/api/v1/agent/stream`, {
    method: 'POST',
    credentials: 'include',
    headers,
    signal: request.signal,
    body: JSON.stringify({
      state: { input: request.input },
      config: { threadId: request.threadId },
      headers: {
        'Accept-Language': acceptLanguage,
      },
      metadata,
    }),
  });
  if (!response.ok) throw await readStreamError(response);
  const reader = response.body?.getReader();
  if (!reader) throw new FileRequestError(response.status, 'Agent stream was empty.');
  const decoder = new TextDecoder();
  let pending = '';
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    pending += decoder.decode(chunk.value, { stream: true });
    const consumed = consumeSseBlocks(pending);
    pending = consumed.rest;
    for (const block of consumed.blocks) {
      const frame = parseSseBlock(block);
      if (!frame) continue;
      request.onEvent(JSON.parse(frame.data) as AgentStreamEnvelope);
    }
  }
  pending += decoder.decode();
  const tail = consumeSseBlocks(`${pending}\n\n`);
  for (const block of tail.blocks) {
    const frame = parseSseBlock(block);
    if (!frame) continue;
    request.onEvent(JSON.parse(frame.data) as AgentStreamEnvelope);
  }
}

async function readStreamError(response: Response): Promise<FileRequestError> {
  let message = response.statusText;
  let errorCode: string | undefined;
  try {
    const body = (await response.json()) as { message?: string; responseType?: string };
    if (body.message?.trim()) message = body.message.trim();
    if (body.responseType) errorCode = body.responseType;
  } catch {
    message = response.statusText;
  }
  return new FileRequestError(response.status, message, errorCode);
}
