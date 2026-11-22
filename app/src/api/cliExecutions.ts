import { FileRequestError, apiData } from './fileRequest';

/** Request body for `POST /api/v1/cli/executions`. */
export interface CliExecutionRequest {
  /** Shell script or bash command to run. */
  script: string;
  /** Optional environment variables passed into the process. */
  environment?: Record<string, string>;
}

/** Successful execution payload returned under the AgentGo `{ data }` envelope. */
export interface CliExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs?: number;
  status?: string;
}

/**
 * Runs a one-shot CLI / shell execution on AgentGo Backend.
 *
 * Uses the signed-in user's session cookies and standard backend request headers
 * (`Accept-Language`, etc.) for permission checks—no extra permission headers.
 *
 * @param body script and optional environment map
 * @returns structured exit code and captured output
 */
export async function createCliExecution(body: CliExecutionRequest): Promise<CliExecutionResult> {
  return apiData<CliExecutionResult>('/api/v1/cli/executions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Maps a CLI execution failure onto an i18n message key.
 *
 * @param caught error thrown by the API client
 * @returns vue-i18n message key under `cli.*`
 */
export function cliExecutionFailureI18n(caught: unknown): string {
  if (!(caught instanceof FileRequestError)) return 'cli.runError';
  if (caught.errorCode === 'CLI-004' || caught.status === 403) return 'cli.forbidden';
  if (caught.status === 401) return 'cli.forbidden';
  if (caught.status === 400 || caught.errorCode === 'CLI-001') return 'cli.invalid';
  return 'cli.runError';
}

/**
 * Parses `KEY=VALUE` lines into an environment map.
 * Blank lines and lines without `=` are skipped.
 *
 * @param text multiline KEY=VALUE text
 * @returns environment map, or undefined when empty
 */
export function parseEnvLines(text: string): Record<string, string> | undefined {
  const environment: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    if (!key) continue;
    environment[key] = line.slice(separator + 1);
  }
  return Object.keys(environment).length ? environment : undefined;
}
