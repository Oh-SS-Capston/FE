import { apiClient } from "../../../shared/api/client";

export function prepareTokenChargeCheckout(amount) {
  return apiClient("/api/v1/payments/portone/token-checkout", {
    method: "POST",
    body: {
      amount,
    },
  });
}

export function verifyTokenChargePayment(paymentId) {
  return apiClient("/api/v1/payments/portone/token-verify", {
    method: "POST",
    body: {
      paymentId,
    },
  });
}
