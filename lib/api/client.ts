export const API_BASE_URL =
  process.env.NEXT_PUBLIC_QURANFLOW_API_BASE_URL?.replace(/\/$/, "") ??
  "/api/quranflow";

const ACCESS_TOKEN_KEY = "quranflow.access_token";
const REFRESH_TOKEN_KEY = "quranflow.refresh_token";
const AUTH_CHANGED_EVENT = "quranflow.auth_changed";

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
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
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }
  if (init.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (auth && token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: requestHeaders,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : `QuranFlow API request failed with ${response.status}`;
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

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await apiFetch<{ access_token: string }>(
      "/api/v1/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
        retryOnUnauthorized: false,
      },
    );
    storeAccessToken(response.access_token);
    return true;
  } catch {
    clearAuthTokens();
    return false;
  }
}

export function shouldUseMockFallback(error: unknown) {
  return (
    !hasAccessToken() ||
    (error instanceof ApiError && (error.status === 401 || error.status === 403))
  );
}
