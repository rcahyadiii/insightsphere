import { api, toQuery } from "@/app/lib/api";

export type BranchStatus = "active" | "inactive" | "all";

export interface BranchResponse {
  id: string;
  store_nbr: number;
  branch_code: string;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  opening_time: string | null;
  closing_time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BranchCreateRequest {
  store_nbr: number;
  branch_code: string;
  name: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
}

export interface BranchUpdateRequest {
  store_nbr?: number;
  branch_code?: string;
  name?: string;
  address?: string;
  phone?: string | null;
  email?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  is_active?: boolean;
}

export interface FetchBranchesParams {
  status?: BranchStatus;
  search?: string;
  skip?: number;
  limit?: number;
}

export function fetchBranches(params: FetchBranchesParams = {}) {
  return api<BranchResponse[]>("/branches", {
    query: toQuery({
      status: params.status,
      search: params.search,
      skip: params.skip,
      limit: params.limit,
    }),
  });
}

export function fetchBranch(branchId: string) {
  return api<BranchResponse>(`/branches/${branchId}`);
}

export function createBranch(payload: BranchCreateRequest) {
  return api<BranchResponse>("/branches", {
    method: "POST",
    body: payload,
  });
}

export function updateBranch(branchId: string, payload: BranchUpdateRequest) {
  return api<BranchResponse>(`/branches/${branchId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deactivateBranch(branchId: string) {
  return api<BranchResponse>(`/branches/${branchId}`, {
    method: "DELETE",
  });
}
