import { API_BASE_URL } from "../../app/config/env";
import { formatUserMessage } from "../lib/userErrorMessage";

export class ApiError extends Error {
  constructor(message, { status, code, result } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.result = result;
  }
}

export async function apiClient(path, options = {}) {
  const {
    body,
    headers,
    skipAuthRefresh = false,
    ...restOptions
  } = options;

  const makeRequest = () =>
    fetch(`${API_BASE_URL}${path}`, {
      ...restOptions,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let response = await makeRequest();

  if (
    response.status === 401 &&
    !skipAuthRefresh &&
    path !== "/api/v1/auth/refresh"
  ) {
    const refreshResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (refreshResponse.ok) {
      response = await makeRequest();
    }
  }

  const contentType = response.headers.get("content-type") ?? "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok || data?.isSuccess === false) {
    throw new ApiError(formatUserMessage(data?.message, "API 요청에 실패했습니다."), {
      status: response.status,
      code: data?.code,
      result: data?.result,
    });
  }

  return data?.result ?? data;
}
