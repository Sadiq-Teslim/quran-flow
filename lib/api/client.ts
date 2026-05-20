const DEFAULT_API_BASE_URL = "/api/quranflow";
const OLD_API_BASE_URL = "https://quran-flow.onrender.com";

function normalizeApiBaseUrl(value: string | undefined) {
  const baseUrl = value?.replace(/\/$/, "") || DEFAULT_API_BASE_URL;
  return baseUrl === OLD_API_BASE_URL
    ? "https://quran-flow-1.onrender.com"
    : baseUrl;
}

export const API_BASE_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_QURANFLOW_API_BASE_URL,
);
const API_TIMEOUT_MS = Number(
  process.env.NEXT_PUBLIC_QURANFLOW_API_TIMEOUT_MS ?? 10000,
);

const ACCESS_TOKEN_KEY = "quranflow.access_token";
const REFRESH_TOKEN_KEY = "quranflow.refresh_token";
const AUTH_CHANGED_EVENT = "quranflow.auth_changed";

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

type ApiEnvelope<T> = {
  data?: T;
  meta?: unknown;
  errors?: unknown[];
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function hasAccessToken() {
  return Boolean(getAccessToken());
}

function emitAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function subscribeToAuthChanges(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === ACCESS_TOKEN_KEY || event.key === REFRESH_TOKEN_KEY) {
      callback();
    }
  };

  window.addEventListener(AUTH_CHANGED_EVENT, callback);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function storeAuthTokens(tokens: {
  access_token: string;
  refresh_token?: string;
}) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  if (tokens.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }
  emitAuthChanged();
}

export function storeAccessToken(accessToken: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  emitAuthChanged();
}

export function clearAuthTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  emitAuthChanged();
}

export async function apiFetch<T>(
  path: string,
  {
    auth = false,
    headers,
    retryOnUnauthorized = true,
    ...init
  }: ApiFetchOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }
  if (init.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (auth && !token) {
    clearTimeout(timeoutId);
    throw new ApiError("Sign in to continue.", 401, null);
  }
  if (auth && token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: requestHeaders,
      signal: init.signal ?? controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = errorMessage(payload, response.status);
    if (auth && response.status === 401 && retryOnUnauthorized) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiFetch<T>(path, {
          ...init,
          auth,
          headers,
          retryOnUnauthorized: false,
        });
      }
    }
    if (auth && response.status === 401) {
      clearAuthTokens();
    }

    throw new ApiError(message, response.status, payload);
  }

  return unwrapPayload<T>(payload);
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthTokens();
    return false;
  }

  try {
    const response = await apiFetch<{
      access_token?: string;
      refresh_token?: string;
      session_token?: string;
    }>(
      "/api/v1/auth/refresh",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${refreshToken}` },
        retryOnUnauthorized: false,
      },
    );
    const accessToken = response.access_token ?? response.session_token;
    const nextRefreshToken = response.refresh_token ?? response.session_token;
    if (!accessToken) {
      clearAuthTokens();
      return false;
    }
    storeAuthTokens({
      access_token: accessToken,
      refresh_token: nextRefreshToken,
    });
    return true;
  } catch {
    clearAuthTokens();
    return false;
  }
}

export function shouldUseMockFallback(error: unknown) {
  const isNetworkError =
    error instanceof TypeError ||
    (error instanceof Error && error.name === "AbortError");
  return (
    isNetworkError ||
    !hasAccessToken() ||
    (error instanceof ApiError && (error.status === 401 || error.status === 403))
  );
}

function unwrapPayload<T>(payload: unknown): T {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload &&
    "errors" in payload
  ) {
    const envelope = payload as ApiEnvelope<T>;
    if (Array.isArray(envelope.errors) && envelope.errors.length > 0) {
      throw new ApiError("QuranFlow API returned errors.", 200, payload);
    }
    return envelope.data as T;
  }
  return payload as T;
}

function errorMessage(payload: unknown, status: number) {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (typeof payload !== "object" || payload === null) {
    return `QuranFlow API request failed with ${status}`;
  }

  const obj = payload as Record<string, unknown>;
  const error = obj.error;
  if (typeof error === "object" && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (typeof errorObj.message === "string") return errorObj.message;
    if (typeof errorObj.error_description === "string") {
      return errorObj.error_description;
    }
  }

  const detail = obj.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as Record<string, unknown>;
    if (typeof first.msg === "string") return first.msg;
  }
  if (typeof obj.message === "string") return obj.message;

  return `QuranFlow API request failed with ${status}`;
}
