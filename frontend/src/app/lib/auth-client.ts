/**
 * Auth Client — Phase 0.3.
 *
 * Thin wrapper untuk memanggil Next.js API auth proxy routes dari client
 * (AuthContext, PortalTemplate login form, etc). Abstraksi tipis di atas
 * fetch — TIDAK pakai `api` instance dari api.ts karena:
 *   1. baseURL api.ts = /api/backend, sementara auth routes di /api/auth
 *   2. Error handling auth sedikit berbeda (2FA challenge bukan error)
 *   3. Menghindari recursive event emission saat cookie invalid.
 */

import { ApiError } from "./api";
import type { UserRole as BackendRole } from "@/app/domain/constants";
export type { UserRole as BackendRole } from "@/app/domain/constants";

// ============================================================
// Types (mirror backend UserResponse + request shapes)
// ============================================================

export interface BackendUser {
  id: string;
  username: string;
  full_name: string | null;
  role: BackendRole;
  store_nbr: number | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  avatar_url: string | null;
  is_active: boolean;
  two_factor_enabled: boolean;
}

export interface LoginRequest {
  username: string;
  pin: string;
}

export interface UpdateMeRequest {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  avatar_url?: string | null;
}

export interface LoginSuccess {
  user: BackendUser;
}

export interface LoginChallenge {
  requires_2fa: true;
  challenge_token: string;
  message?: string;
}

export type LoginResponse = LoginSuccess | LoginChallenge;

// ============================================================
// Helpers
// ============================================================

async function requestJson<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const init: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  // Hanya verb mutasi yang attach body + Content-Type.
  if (method !== "GET" && body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  // GET/PATCH/DELETE harus selalu fresh — POST tidak butuh override karena
  // browser memang tidak men-cache POST secara default.
  if (method !== "POST") {
    init.cache = "no-store";
  }

  const resp = await fetch(path, init);
  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    throw new ApiError(
      resp.status,
      data.detail || `Request failed: ${resp.status}`,
      data
    );
  }

  return data as T;
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  return requestJson<T>("POST", path, body);
}

async function getJson<T>(path: string): Promise<T> {
  return requestJson<T>("GET", path);
}

async function patchJson<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>("PATCH", path, body);
}

async function deleteJson<T>(path: string): Promise<T> {
  return requestJson<T>("DELETE", path);
}

// ============================================================
// Public API
// ============================================================

/**
 * Login step 1 — username + PIN.
 * Return:
 *   - `{ user }` kalau 2FA disabled (sukses penuh)
 *   - `{ requires_2fa, challenge_token }` kalau 2FA enabled (lanjut step 2)
 *   - throw ApiError kalau credential invalid
 */
export function login(credentials: LoginRequest): Promise<LoginResponse> {
  return postJson<LoginResponse>("/api/auth/login", credentials);
}

/**
 * Logout — clear httpOnly cookie server-side.
 */
export function logout(): Promise<{ success: true }> {
  return postJson<{ success: true }>("/api/auth/logout");
}

/**
 * Refresh — rotate cookie dengan token baru dari backend.
 * Throw 401 kalau cookie invalid (caller harus redirect ke login).
 */
export function refresh(): Promise<{ success: true }> {
  return postJson<{ success: true }>("/api/auth/refresh");
}

/**
 * Fetch current user profile. 401 = not authenticated / cookie invalid.
 */
export function fetchMe(): Promise<BackendUser> {
  return getJson<BackendUser>("/api/auth/me");
}

export function updateMe(payload: UpdateMeRequest): Promise<BackendUser> {
  return patchJson<BackendUser>("/api/auth/me", payload);
}

// ---- Types ----

export interface TwoFactorSetupInitResponse {
  secret: string;
  otpauth_uri: string;
  qr_code_base64: string;
  issuer: string;
  account_name: string;
}

export interface TwoFactorEnableResponse {
  message: string;
  backup_codes: string[];
}

export interface LoginActivityItem {
  id: string;
  username_attempted: string;
  ip_address: string | null;
  user_agent: string | null;
  status: "SUCCESS" | "FAILED";
  failure_reason: string | null;
  timestamp: string;
}

export interface BackendUserListItem extends BackendUser {
  created_at?: string;
}

// ---- 2FA ----

export function twoFaSetupInit(): Promise<TwoFactorSetupInitResponse> {
  return postJson<TwoFactorSetupInitResponse>("/api/auth/2fa/setup/init");
}

export function twoFaSetupVerify(payload: {
  secret: string;
  code: string;
}): Promise<TwoFactorEnableResponse> {
  return postJson<TwoFactorEnableResponse>("/api/auth/2fa/setup/verify", payload);
}

export function twoFaDisable(payload: {
  pin: string;
  code: string;
}): Promise<{ message: string }> {
  return postJson<{ message: string }>("/api/auth/2fa/disable", payload);
}

// ---- PIN / Password ----

export function changePin(payload: {
  current_pin: string;
  new_pin: string;
}): Promise<{ message: string }> {
  return postJson<{ message: string }>("/api/auth/change-password", payload);
}

// ---- Login History ----

export function fetchLoginHistory(limit = 20): Promise<LoginActivityItem[]> {
  return getJson<LoginActivityItem[]>(`/api/auth/login-history?limit=${limit}`);
}

// ---- User CRUD (admin/owner) ----

export interface UserUpdateRequest {
  full_name?: string | null;
  role?: string | null;
  store_nbr?: number | null;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  avatar_url?: string | null;
  is_active?: boolean | null;
}

export interface InviteUserRequest {
  email: string;
  role: string;
  store_nbr?: number | null;
  full_name?: string | null;
}

export function updateUser(
  userId: string,
  payload: UserUpdateRequest
): Promise<BackendUserListItem> {
  return patchJson<BackendUserListItem>(`/api/auth/users/${userId}`, payload);
}

export function deleteUser(userId: string): Promise<BackendUserListItem> {
  return deleteJson<BackendUserListItem>(`/api/auth/users/${userId}`);
}

export function inviteUser(payload: InviteUserRequest): Promise<{ id: string; email: string }> {
  return postJson<{ id: string; email: string }>("/api/auth/invite-user", payload);
}

// ---- User List (admin/owner) ----

export interface UserListParams {
  is_active?: boolean;
  role?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

export function fetchUsers(params: UserListParams = {}): Promise<BackendUserListItem[]> {
  const qs = new URLSearchParams();
  if (params.is_active !== undefined) qs.set("is_active", String(params.is_active));
  if (params.role) qs.set("role", params.role);
  if (params.search) qs.set("search", params.search);
  if (params.skip !== undefined) qs.set("skip", String(params.skip));
  if (params.limit !== undefined) qs.set("limit", String(params.limit));
  const url = `/api/auth/users${qs.toString() ? `?${qs}` : ""}`;
  return getJson<BackendUserListItem[]>(url);
}

/**
 * Helper: cek apakah LoginResponse adalah 2FA challenge.
 */
export function isChallenge(resp: LoginResponse): resp is LoginChallenge {
  return "requires_2fa" in resp && resp.requires_2fa === true;
}

// ---- Mirror Mode ----

export interface MirrorSession {
  id: string;
  actor_user_id: string;
  actor_role: BackendRole;
  target_role: BackendRole;
  started_at: string;
  expires_at: string;
}

export function fetchMirrorSession(): Promise<MirrorSession | null> {
  return getJson<MirrorSession | null>("/api/auth/mirror");
}

export function startMirrorSession(target_role: BackendRole): Promise<MirrorSession> {
  return postJson<MirrorSession>("/api/auth/mirror", { target_role });
}

export function stopMirrorSession(): Promise<void> {
  return deleteJson<void>("/api/auth/mirror");
}
