import { API_BASE_URL } from "../../../app/config/env";
import { apiClient } from "../../../shared/api/client";

export function redirectToGoogleLogin() {
  window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
}

export function getCurrentUser() {
  return apiClient("/api/v1/auth/me", {
    method: "GET",
  });
}

export function logout() {
  return apiClient("/api/v1/auth/logout", {
    method: "POST",
    skipAuthRefresh: true,
  });
}