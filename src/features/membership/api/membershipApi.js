import { apiClient } from "../../../shared/api/client";

export function getMyMembership() {
  return apiClient("/api/v1/membership/me", {
    method: "GET",
  });
}