import { apiClient } from "../../../shared/api/client";

export function preparePortOneCheckout() {
  return apiClient("/api/v1/payments/portone/checkout", {
    method: "POST",
  });
}

export function verifyPortOnePayment(paymentId) {
  return apiClient("/api/v1/payments/portone/verify", {
    method: "POST",
    body: {
      paymentId,
    },
  });
}

export function cancelPortOnePayment(paymentId, reason = "테스트 결제 취소") {
  return apiClient(`/api/v1/payments/portone/${paymentId}/cancel`, {
    method: "POST",
    body: {
      reason,
    },
  });
}