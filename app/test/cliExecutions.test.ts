import { describe, expect, it } from 'vitest';

import { FileRequestError } from '../src/api/fileRequest';
import { cliExecutionFailureI18n, parseEnvLines } from '../src/api/cliExecutions';

describe('cliExecutionFailureI18n', () => {
  it('maps CLI-004 and 403 to forbidden', () => {
    expect(cliExecutionFailureI18n(new FileRequestError(403, 'blocked', 'CLI-004'))).toBe(
      'cli.forbidden',
    );
    expect(cliExecutionFailureI18n(new FileRequestError(403, 'blocked'))).toBe('cli.forbidden');
  });

  it('maps CLI-001 and 400 to invalid', () => {
    expect(cliExecutionFailureI18n(new FileRequestError(400, 'bad', 'CLI-001'))).toBe(
      'cli.invalid',
    );
  });
});

describe('parseEnvLines', () => {
  it('parses KEY=VALUE lines and skips comments', () => {
    expect(
      parseEnvLines(`
# comment
FOO=bar
EMPTY=
PATH=/usr/bin:/bin
invalid-line
`),
    ).toEqual({
      FOO: 'bar',
      EMPTY: '',
      PATH: '/usr/bin:/bin',
    });
  });

  it('returns undefined for blank input', () => {
    expect(parseEnvLines('  \n# only comment\n')).toBeUndefined();
  });
});
