// Thin fetch wrapper for talking to the Maruthi Catalyst backend.
//
// VITE_API_URL should point at the backend origin, e.g.
//   VITE_API_URL=https://maruthi-catalyst-backend.onrender.com        (development)
//   VITE_API_URL=https://api.my-domain.com    (production)
//
// If it's left empty, requests are made relative to the frontend's own
// origin (useful if the backend is reverse-proxied under /api on the same
// domain).
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include', // send/receive the admin session cookie
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    // Network failure (backend unreachable, offline, CORS, etc.)
    throw new ApiError('We could not reach the server. Please check your connection and try again.', 0);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = body?.message || 'Something went wrong. Please try again in a few minutes.';
    throw new ApiError(message, response.status, body?.fieldErrors);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: data !== undefined ? JSON.stringify(data) : undefined }),
};
