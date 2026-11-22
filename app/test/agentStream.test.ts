import { describe, expect, it } from 'vitest';

import { FileRequestError } from '../src/api/fileRequest';
import {
  agentStreamFailureI18n,
  applyAgentStreamEvent,
  consumeSseBlocks,
  emptyAgentTurnVo,
  parseSseBlock,
} from '../src/api/agentStream';

describe('consumeSseBlocks', () => {
  it('keeps an incomplete frame in the remainder', () => {
    const consumed = consumeSseBlocks(
      'event: message\ndata: {"a":1}\n\nevent: message\ndata: {"a":',
    );
    expect(consumed.blocks).toEqual(['event: message\ndata: {"a":1}']);
    expect(consumed.rest).toBe('event: message\ndata: {"a":');
  });

  it('normalizes CRLF frames', () => {
    const consumed = consumeSseBlocks('id: 1\r\nevent: node.lifecycle\r\ndata: {}\r\n\r\n');
    expect(consumed.blocks).toEqual(['id: 1\nevent: node.lifecycle\ndata: {}']);
    expect(consumed.rest).toBe('');
  });
});

describe('parseSseBlock', () => {
  it('joins multiline data and trims the optional space', () => {
    const frame = parseSseBlock('id: evt-1\nevent: message\ndata: {"content":\ndata: "hello"}');
    expect(frame).toEqual({
      id: 'evt-1',
      event: 'message',
      data: '{"content":\n"hello"}',
    });
  });

  it('ignores comment-only frames', () => {
    expect(parseSseBlock(': keep-alive')).toBeNull();
  });
});

describe('applyAgentStreamEvent', () => {
  it('builds plan steps and the output answer without raw activity lines', () => {
    let turn = emptyAgentTurnVo();
    turn = applyAgentStreamEvent(turn, {
      eventId: '1',
      data: { kind: 'node.lifecycle', phase: 'STARTED', threadId: 't', nodeId: 'plan' },
    });
    expect(turn.planPreparing).toBe(true);
    turn = applyAgentStreamEvent(turn, {
      eventId: '2',
      data: {
        kind: 'message',
        phase: 'ASSISTANT',
        threadId: 't',
        nodeId: 'plan',
        content: '1. Add\n2. Verify',
      },
    });
    turn = applyAgentStreamEvent(turn, {
      eventId: '3',
      data: {
        kind: 'node.lifecycle',
        phase: 'COMPLETED',
        threadId: 't',
        nodeId: 'output',
        content: '**2**',
      },
    });
    turn = applyAgentStreamEvent(turn, {
      eventId: '4',
      finished: true,
      data: { kind: 'agent.lifecycle', phase: 'COMPLETED', threadId: 't', content: '**2**' },
    });
    expect(turn.planSteps.map((step) => step.text)).toEqual(['Add', 'Verify']);
    expect(turn.answer.content).toBe('**2**');
    expect(turn.final).toBe(true);
    expect(turn.failed).toBe(false);
  });

  it('appends assistant answer deltas while the model streams', () => {
    let turn = emptyAgentTurnVo();
    turn = applyAgentStreamEvent(turn, {
      eventId: '1',
      data: {
        kind: 'message',
        phase: 'ASSISTANT_DELTA',
        threadId: 't',
        nodeId: 'llm',
        content: 'Hel',
      },
    });
    turn = applyAgentStreamEvent(turn, {
      eventId: '2',
      data: {
        kind: 'message',
        phase: 'ASSISTANT_DELTA',
        threadId: 't',
        nodeId: 'llm',
        content: 'lo',
      },
    });
    expect(turn.answer.content).toBe('Hello');
    expect(turn.answer.final).toBe(false);
  });

  it('marks a failed run and uses the failure text when no answer arrived', () => {
    const turn = applyAgentStreamEvent(emptyAgentTurnVo(), {
      eventId: '9',
      data: {
        kind: 'agent.lifecycle',
        phase: 'FAILED',
        threadId: 't',
        content: 'Qwen request failed.',
      },
    });
    expect(turn.final).toBe(true);
    expect(turn.failed).toBe(true);
    expect(turn.answer.content).toBe('Qwen request failed.');
  });
});

describe('agentStreamFailureI18n', () => {
  it('maps busy and invalid agent responses', () => {
    expect(agentStreamFailureI18n(new FileRequestError(503, 'busy', 'AGENT-002'))).toBe(
      'chat.busy',
    );
    expect(agentStreamFailureI18n(new FileRequestError(400, 'bad', 'AGENT-001'))).toBe(
      'chat.invalid',
    );
  });
});
