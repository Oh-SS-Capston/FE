import { API_BASE_URL } from "../../app/config/env";

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
  const { body, headers, ...restOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,

    // 로그인은 팀원이 처리하더라도,
    // 백엔드 인증 쿠키를 보내려면 이 옵션은 필요함
    credentials: "include",

    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },

    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") ?? "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok || data?.isSuccess === false) {
    throw new ApiError(data?.message ?? "API 요청에 실패했습니다.", {
      status: response.status,
      code: data?.code,
      result: data?.result,
    });
  }

  return data?.result ?? data;
}