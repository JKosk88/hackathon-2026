export const API_BASE_URL = "https://hybe.toster.net/api/";

export function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    window.localStorage.getItem("hybe-access-token") ??
    window.localStorage.getItem("cityVibe-token") ??
    null
  );
}

export function getStoredRefreshToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("hybe-refresh-token") ?? null;
}

export function saveTokenPair(accessToken: string, refreshToken?: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("hybe-access-token", accessToken);

  if (refreshToken) {
    window.localStorage.setItem("hybe-refresh-token", refreshToken);
  } else {
    window.localStorage.removeItem("hybe-refresh-token");
  }
}

export function clearStoredTokens() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("hybe-access-token");
  window.localStorage.removeItem("hybe-refresh-token");
  window.localStorage.removeItem("cityVibe-token");
}

export type ApiErrorPayload = {
  message?: string;
  error?: string;
  errors?: Record<string, string[] | string>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly payload: ApiErrorPayload | null;

  constructor(
    status: number,
    message: string,
    payload: ApiErrorPayload | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function buildApiUrl(path: string) {
  const normalizedBase = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}

export type ApiRequestOptions = RequestInit & {
  timeoutMs?: number;
};

type TokenRefreshResponse = {
  access?: string;
  refresh?: string;
};

async function refreshStoredTokens(signal?: AbortSignal) {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(buildApiUrl("/token/refresh/"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken }),
    signal,
  });

  if (!response.ok) {
    clearStoredTokens();
    return null;
  }

  const payload = (await response.json()) as TokenRefreshResponse;
  const accessToken = payload.access;
  const nextRefreshToken = payload.refresh ?? refreshToken;

  if (!accessToken) {
    clearStoredTokens();
    return null;
  }

  saveTokenPair(accessToken, nextRefreshToken);
  return { accessToken };
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { timeoutMs = 15000, ...requestOptions } = options;
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(requestOptions.headers ?? {});

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (
    requestOptions.body &&
    !(requestOptions.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = getStoredAccessToken();
  if (
    accessToken &&
    !path.includes("/token/") &&
    !headers.has("Authorization")
  ) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  async function executeRequest() {
    return fetch(buildApiUrl(path), {
      ...requestOptions,
      headers,
      signal: controller.signal,
    });
  }

  async function parseResponse(response: Response): Promise<T> {
    const rawBody = await response.text();
    let payload: unknown = null;

    if (rawBody) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = rawBody;
      }
    }

    if (!response.ok) {
      const message =
        (typeof payload === "object" &&
        payload &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : undefined) ??
        (typeof payload === "object" &&
        payload &&
        "error" in payload &&
        typeof payload.error === "string"
          ? payload.error
          : undefined) ??
        `Request failed with status ${response.status}`;

      throw new ApiError(
        response.status,
        message,
        typeof payload === "object" && payload
          ? (payload as ApiErrorPayload)
          : null,
      );
    }

    if (response.status === 204 || rawBody === "") {
      return undefined as T;
    }

    return (payload as T) ?? (undefined as T);
  }

  try {
    const response = await executeRequest();

    if (response.status === 401 && !path.includes("/token/refresh/")) {
      const refreshed = await refreshStoredTokens(controller.signal);

      if (refreshed) {
        headers.set("Authorization", `Bearer ${refreshed.accessToken}`);
        return await parseResponse(await executeRequest());
      }
    }

    return await parseResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(408, "Request timed out.", null);
    }

    throw new ApiError(
      500,
      error instanceof Error ? error.message : "An unexpected error occurred.",
      null,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
