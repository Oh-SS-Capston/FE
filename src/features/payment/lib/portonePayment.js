import * as PortOne from "@portone/browser-sdk/v2";
import { formatUserErrorMessage } from "../../../shared/lib/userErrorMessage";

function toPortOneCurrency(currency) {
  if (!currency) {
    return "CURRENCY_KRW";
  }

  if (currency.startsWith("CURRENCY_")) {
    return currency;
  }

  return `CURRENCY_${currency}`;
}

export function formatPaymentErrorMessage(error) {
  return formatUserErrorMessage(
    error,
    "토큰 충전에 실패했습니다. 잠시 후 다시 시도해주세요."
  );
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
