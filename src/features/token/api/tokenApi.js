import { apiClient } from "../../../shared/api/client";

export function getMyTokenBalance() {
  return apiClient("/api/v1/tokens/me", {
    method: "GET",
  });
}

export function getMyTokenLedgers(limit = 30) {
  return apiClient(`/api/v1/tokens/me/ledger?limit=${limit}`, {
    method: "GET",
  });
}