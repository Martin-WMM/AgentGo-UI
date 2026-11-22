/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';

import { applyAgentStreamEvent, emptyAgentTurnVo } from '../src/agent/events';

describe('tool and CLI activity events', () => {
  it('records bash CLI input and expandable summary', () => {
    let turn = emptyAgentTurnVo();
    turn = applyAgentStreamEvent(turn, {
      data: {
        kind: 'tool.lifecycle',
        phase: 'STARTED',
        threadId: 't1',
        toolName: 'bash',
        content: 'python3\nprint(832040)',
      },
    });
    turn = applyAgentStreamEvent(turn, {
      data: {
        kind: 'cli.lifecycle',
        phase: 'RUNNING',
        threadId: 't1',
        toolName: 'bash',
      },
    });
    turn = applyAgentStreamEvent(turn, {
      data: {
        kind: 'cli.lifecycle',
        phase: 'SUCCEEDED',
        threadId: 't1',
        toolName: 'bash',
        content: 'status=COMPLETED exitCode=0\nstdout:\n12:00',
      },
    });

    expect(turn.toolActivities).toHaveLength(1);
    expect(turn.toolActivities[0]).toMatchObject({
      name: 'bash',
      kind: 'cli',
      status: 'succeeded',
      input: 'python3\nprint(832040)',
      summary: 'status=COMPLETED exitCode=0\nstdout:\n12:00',
    });
  });

  it('keeps separate activities for distinct tool names', () => {
    let turn = emptyAgentTurnVo();
    turn = applyAgentStreamEvent(turn, {
      data: {
        kind: 'tool.lifecycle',
        phase: 'SUCCEEDED',
        threadId: 't1',
        toolName: 'lookup',
        content: '7',
      },
    });
    turn = applyAgentStreamEvent(turn, {
      data: {
        kind: 'tool.lifecycle',
        phase: 'FAILED',
        threadId: 't1',
        toolName: 'bash',
        content: 'Authentication is required.',
      },
    });

    expect(turn.toolActivities.map((item) => item.name)).toEqual(['lookup', 'bash']);
    expect(turn.toolActivities[0]?.kind).toBe('tool');
    expect(turn.toolActivities[1]?.status).toBe('failed');
  });
});
