import * as PortOne from "@portone/browser-sdk/v2";

function toPortOneCurrency(currency) {
  if (!currency) {
    return "CURRENCY_KRW";
  }

  if (currency.startsWith("CURRENCY_")) {
    return currency;
  }

  return `CURRENCY_${currency}`;
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
    throw new Error(response.message || "결제가 취소되었거나 실패했습니다.");
  }

  return response;
}