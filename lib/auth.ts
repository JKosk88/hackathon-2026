import { apiRequest, saveTokenPair } from "@/lib/api";
import type { ApiEnvelope, BackendUser } from "@/types/api";

export type LoginPayload = {
  username: string;
  password: string;
};

export type TokenResponse = {
  access?: string;
  refresh?: string;
  token?: string;
  access_token?: string;
  refresh_token?: string;
  accessToken?: string;
  jwt?: string;
  expires_in?: number;
  user?: BackendUser;
};

function normalizeUserPayload(
  payload: unknown,
  fallbackUsername: string,
  token?: string,
  refreshToken?: string,
): BackendUser {
  if (typeof payload !== "object" || payload === null) {
    return {
      email: fallbackUsername,
      name: fallbackUsername || "User",
      token,
      refreshToken,
    };
  }

  const record = payload as Record<string, unknown>;
  const email =
    typeof record.email === "string"
      ? record.email
      : typeof record.username === "string"
        ? record.username
        : fallbackUsername;
  const name =
    typeof record.name === "string"
      ? record.name
      : typeof record.firstName === "string" &&
          typeof record.lastName === "string"
        ? `${record.firstName} ${record.lastName}`
        : email.split("@")[0] || fallbackUsername || "User";

  return {
    id:
      typeof record.id === "string" || typeof record.id === "number"
        ? record.id
        : undefined,
    email,
    name,
    provider: typeof record.provider === "string" ? record.provider : "email",
    token: typeof record.token === "string" ? record.token : token,
    refreshToken:
      typeof record.refreshToken === "string"
        ? record.refreshToken
        : refreshToken,
  };
}

export async function loginWithEmail(username: string, password: string) {
  const payload = { username, password } satisfies LoginPayload;

  const response = await apiRequest<
    | ApiEnvelope<BackendUser>
    | BackendUser
    | TokenResponse
    | {
        data?: BackendUser;
        user?: BackendUser;
        token?: string;
        refresh?: string;
      }
  >("/token/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const accessToken =
    typeof response === "object" && response && "access" in response
      ? response.access
      : typeof response === "object" && response && "access_token" in response
        ? response.access_token
        : typeof response === "object" && response && "accessToken" in response
          ? response.accessToken
          : typeof response === "object" && response && "token" in response
            ? response.token
            : undefined;

  const refreshToken =
    typeof response === "object" && response && "refresh" in response
      ? response.refresh
      : typeof response === "object" && response && "refresh_token" in response
        ? response.refresh_token
        : undefined;

  if (!accessToken) {
    throw new Error("The token endpoint did not return a valid access token.");
  }

  saveTokenPair(accessToken, refreshToken);

  if (
    typeof response === "object" &&
    response &&
    "data" in response &&
    response.data
  ) {
    return normalizeUserPayload(
      response.data,
      username,
      accessToken,
      refreshToken,
    );
  }

  if (
    typeof response === "object" &&
    response &&
    "user" in response &&
    response.user
  ) {
    return normalizeUserPayload(
      response.user,
      username,
      accessToken,
      refreshToken,
    );
  }

  if (typeof response === "object" && response && "email" in response) {
    return normalizeUserPayload(response, username, accessToken, refreshToken);
  }

  if (typeof response === "object" && response && "username" in response) {
    return normalizeUserPayload(response, username, accessToken, refreshToken);
  }

  return {
    email: username,
    name: username || "User",
    token: accessToken,
    refreshToken,
    provider: "email",
  } satisfies BackendUser;
}

export async function getCurrentUser(token: string) {
  return apiRequest<BackendUser>("/auth/me/", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
