import { API_BASE_URL } from "../../../app/config/env";
import { apiClient } from "../../../shared/api/client";

export function redirectToGoogleLogin() {
  window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
}

export function redirectToGoogleSignup() {
  window.location.href = `${API_BASE_URL}/oauth2/authorization/google?prompt=select_account`;
}

export function getCurrentUser() {
  return apiClient("/api/v1/auth/me", {
    method: "GET",
  });
}

export function checkNicknameAvailability(nickname) {
  return apiClient(
    `/api/v1/auth/nicknames/${encodeURIComponent(nickname)}/availability`,
    {
      method: "GET",
    }
  );
}

export function updateNickname(nickname) {
  return apiClient("/api/v1/auth/me/nickname", {
    method: "PATCH",
    body: {
      nickname,
    },
  });
}

export function logout() {
  return apiClient("/api/v1/auth/logout", {
    method: "POST",
    skipAuthRefresh: true,
  });
}

export function deleteAccount() {
  return apiClient("/api/v1/auth/me", {
    method: "DELETE",
  });
}