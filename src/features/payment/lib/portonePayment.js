import * as PortOne from "@portone/browser-sdk/v2";

const PORTONE_ERROR_MESSAGE = {
  PAY_PROCESS_CANCELED: "결제가 취소되었습니다.",
  PAY_PROCESS_ABORTED: "결제가 중단되었습니다. 다시 시도해주세요.",
  PAY_PROCESS_FAILED: "결제 처리에 실패했습니다. 잠시 후 다시 시도해주세요.",
  PG_PROVIDER_ERROR: "결제사 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  INVALID_REQUEST: "결제 요청 정보가 올바르지 않습니다.",
  UNAUTHORIZED: "결제 인증에 실패했습니다. 다시 로그인한 뒤 시도해주세요.",
  FORBIDDEN: "결제를 진행할 권한이 없습니다.",
};

function toPortOneCurrency(currency) {
  if (!currency) {
    return "CURRENCY_KRW";
  }

  if (currency.startsWith("CURRENCY_")) {
    return currency;
  }

  return `CURRENCY_${currency}`;
}

function extractErrorCode(message) {
  const match = String(message ?? "").match(/^\[([A-Z0-9_]+)\]/);
  return match?.[1] ?? null;
}

export function formatPaymentErrorMessage(error) {
  const code = error?.code ?? extractErrorCode(error?.message);

  if (code && PORTONE_ERROR_MESSAGE[code]) {
    return PORTONE_ERROR_MESSAGE[code];
  }

  const message = String(error?.message ?? "").trim();
  const withoutCode = message.replace(/^\[[A-Z0-9_]+\]\s*/, "").trim();

  return withoutCode || "토큰 충전에 실패했습니다. 잠시 후 다시 시도해주세요.";
}

export async function requestTokenChargePayment(checkout) {
  const response = await PortOne.requestPayment({
    storeId: checkout.storeId,
    channelKey: checkout.channelKey,
    paymentId: checkout.paymentId,
    orderName: checkout.orderName,
    totalAmount: checkout.chargeAmount,
    currency: toPortOneCurrency(checkout.currency),
    payMethod: "CARD",
    customer: {
      customerId: checkout.customerKey,
      email: checkout.customerEmail,
      fullName: checkout.customerName,
    },
  });

  if (!response) {
    throw new Error("결제 응답을 받지 못했습니다.");
  }

  if (response.code !== undefined) {
    const error = new Error(formatPaymentErrorMessage(response));
    error.code = response.code;
    error.rawMessage = response.message;
    throw error;
  }

  return response;
}
