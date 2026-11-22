import { describe, expect, it } from 'vitest';

import {
  createDefaultAgentEventDispatcher,
  emptyAgentTurnVo,
  parsePlanSteps,
} from '../src/agent/events';

describe('parsePlanSteps', () => {
  it('splits numbered plan lines', () => {
    expect(parsePlanSteps('1. One\n2. Two').map((step) => step.text)).toEqual(['One', 'Two']);
  });

  it('keeps a single paragraph as one step', () => {
    expect(parsePlanSteps('Answer directly.').map((step) => step.text)).toEqual([
      'Answer directly.',
    ]);
  });

  it('reads structured plan JSON titles', () => {
    const plan = JSON.stringify({
      goal: 'Explain Gaussian distribution',
      steps: [
        { id: 1, title: 'Outline concepts', instruction: 'List definition and parameters' },
        { id: 2, title: 'Write answer', instruction: 'Compose the explanation' },
      ],
    });
    expect(parsePlanSteps(plan).map((step) => step.text)).toEqual([
      'Outline concepts',
      'Write answer',
    ]);
  });

  it('does not split multi-line essays into checklist rows', () => {
    const essay =
      '## 8. Simple example\nMean 100, sigma 2.\n## 9. Relationship\nGaussian means normal.';
    expect(parsePlanSteps(essay)).toHaveLength(1);
  });
});

describe('createDefaultAgentEventDispatcher', () => {
  it('advances plan steps from tool lifecycle events', () => {
    const dispatcher = createDefaultAgentEventDispatcher();
    let turn = emptyAgentTurnVo();
    turn = dispatcher.dispatch(turn, {
      data: {
        kind: 'message',
        phase: 'ASSISTANT',
        threadId: 't',
        nodeId: 'plan',
        content: '1. Call tool\n2. Reply',
      },
    });
    turn = dispatcher.dispatch(turn, {
      data: { kind: 'tool.lifecycle', phase: 'STARTED', threadId: 't', toolName: 'shell' },
    });
    expect(turn.planSteps[0]?.status).toBe('running');
    turn = dispatcher.dispatch(turn, {
      data: { kind: 'tool.lifecycle', phase: 'SUCCEEDED', threadId: 't', toolName: 'shell' },
    });
    expect(turn.planSteps[0]?.status).toBe('succeeded');
  });
});
