import { backendBaseUrl } from '../stores/auth';

/** Error raised when a workspace file request is rejected by the backend. */
export class FileRequestError extends Error {
  readonly status: number;
  readonly errorCode?: string;

  constructor(status: number, message: string, errorCode?: string) {
    super(message);
    this.name = 'FileRequestError';
    this.status = status;
    this.errorCode = errorCode;
  }
}

interface ErrorBody {
  message?: string;
  responseType?: string;
  errors?: Array<{ code?: string; message?: string }>;
}

interface ApiResponse<T> {
  data: T;
}

/**
 * Performs a cookie-session request against AgentGo Backend.
 *
 * @param path API path beginning with `/api/`
 * @param init optional fetch options
 * @returns parsed JSON payload, or `undefined` for HTTP 204
 */
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${backendBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: { Accept: 'application/json', ...init?.headers },
  });
  if (!response.ok) throw await toFileRequestError(response);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

/** Unwraps a successful `{ data }` envelope. */
export async function apiData<T>(path: string, init?: RequestInit): Promise<T> {
  const body = await apiRequest<ApiResponse<T>>(path, init);
  return body.data;
}

async function toFileRequestError(response: Response): Promise<FileRequestError> {
  let message = '';
  let errorCode: string | undefined;
  try {
    const body = (await response.json()) as ErrorBody;
    message = body.message?.trim() ?? body.errors?.find((item) => item.message)?.message?.trim() ?? '';
    errorCode = body.responseType ?? body.errors?.find((item) => item.code)?.code;
  } catch {
    message = '';
  }
  return new FileRequestError(response.status, message, errorCode);
}

/** Maps a file API failure onto an i18n message key. */
export function uploadFailureI18n(caught: unknown): { key: string; limit: string } {
  const limit =
    caught instanceof FileRequestError
      ? (caught.message.match(/(\d+(?:\.\d+)?)\s*MB/i)?.[0] ?? '100 MB')
      : '100 MB';
  if (!(caught instanceof FileRequestError)) return { key: 'files.uploadError', limit };
  if (caught.errorCode === 'FILE-011' || caught.status === 413) {
    return { key: 'files.uploadTooLarge', limit };
  }
  if (caught.errorCode === 'FILE-012') return { key: 'files.uploadEmpty', limit };
  if (caught.errorCode === 'FILE-013') return { key: 'files.uploadInvalidPath', limit };
  if (caught.errorCode === 'FILE-014') return { key: 'files.uploadUnreadable', limit };
  if (caught.status === 403) return { key: 'files.uploadForbidden', limit };
  return { key: 'files.uploadError', limit };
}
