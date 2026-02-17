export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ParsedErrorResult {
  readonly message: string | null;
  readonly wasJson: boolean;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isLikelyHtml(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return normalized.startsWith('<!doctype html') || normalized.startsWith('<html');
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function formatHttpStatus(status: number, statusText: string): string {
  const normalizedStatusText = statusText.trim();
  return normalizedStatusText.length > 0
    ? `HTTP ${status} ${normalizedStatusText}`
    : `HTTP ${status}`;
}

async function parseErrorResponse(response: Response): Promise<ParsedErrorResult> {
  const bodyAsJson = await response.clone().json().catch(() => null) as unknown;

  if (bodyAsJson !== null && typeof bodyAsJson === 'object') {
    const body = bodyAsJson as Record<string, unknown>;
    return {
      message: readString(body['error']) ?? readString(body['message']) ?? readString(body['detail']),
      wasJson: true,
    };
  }

  const bodyAsText = (await response.text().catch(() => '')).trim();
  if (!bodyAsText || isLikelyHtml(bodyAsText)) {
    return { message: null, wasJson: false };
  }

  return {
    message: truncate(bodyAsText, 220),
    wasJson: false,
  };
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers();
  if (options.headers) {
    new Headers(options.headers).forEach((value, key) => {
      headers.set(key, value);
    });
  }
  const isFormData = options.body instanceof FormData;
  if (!headers.has('Content-Type') && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    headers,
  });

  if (!response.ok) {
    const parsed = await parseErrorResponse(response);
    const fallbackMessage = parsed.wasJson
      ? `HTTP ${response.status}`
      : `Request failed (${formatHttpStatus(response.status, response.statusText)})`;
    throw new ApiError(response.status, parsed.message ?? fallbackMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json();
  return data as T;
}
