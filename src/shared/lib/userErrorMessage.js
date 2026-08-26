const ERROR_CODE_MESSAGE = {
  PAY_PROCESS_CANCELED: "결제가 취소되었습니다.",
  PAY_PROCESS_ABORTED: "결제가 중단되었습니다. 다시 시도해주세요.",
  PAY_PROCESS_FAILED: "결제 처리에 실패했습니다. 잠시 후 다시 시도해주세요.",
  PG_PROVIDER_ERROR: "결제사 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  TOKEN402_1: "토큰이 부족합니다.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  FORBIDDEN: "요청 권한이 없습니다.",
};

const NETWORK_ERROR_PATTERNS = [
  "failed to fetch",
  "failed to feth",
  "networkerror",
  "network error",
  "load failed",
  "err_network",
  "err_internet_disconnected",
  "err_connection_refused",
  "err_connection_reset",
  "err_connection_timed_out",
  "the network connection was lost",
];

export function extractErrorCode(message) {
  const match = String(message ?? "").match(/^\[([A-Z0-9_]+)\]/);
  return match?.[1] ?? null;
}

function isNetworkErrorMessage(message) {
  const normalizedMessage = String(message ?? "").trim().toLowerCase();

  return NETWORK_ERROR_PATTERNS.some((pattern) =>
    normalizedMessage.includes(pattern)
  );
}

export function formatUserMessage(message, fallback = "요청 처리에 실패했습니다.") {
  const rawMessage = String(message ?? "").trim();
  const code = extractErrorCode(rawMessage);

  if (code && ERROR_CODE_MESSAGE[code]) {
    return ERROR_CODE_MESSAGE[code];
  }

  if (isNetworkErrorMessage(rawMessage)) {
    return "서버와 연결할 수 없습니다. 인터넷 연결을 확인한 뒤 다시 시도해주세요.";
  }

  const withoutCode = rawMessage.replace(/^\[[A-Z0-9_]+\]\s*/, "").trim();

  return withoutCode || fallback;
}

export function formatUserErrorMessage(error, fallback = "요청 처리에 실패했습니다.") {
  if (error?.code && ERROR_CODE_MESSAGE[error.code]) {
    return ERROR_CODE_MESSAGE[error.code];
  }

  if (error?.name === "AbortError") {
    return "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
  }

  return formatUserMessage(error?.message ?? error, fallback);
}
