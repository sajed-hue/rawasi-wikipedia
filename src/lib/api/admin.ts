// Admin endpoints: moderation, categories, users, audit logs.
// Every call requires a signed-in Admin; the backend enforces the role (403 otherwise).

import { api } from "./client";
import type {
  ApprovePostRequest,
  AuditLogDto,
  CategoryAdminDto,
  CreateCategoryRequest,
  ModerationPostDetailDto,
  ModerationPostDto,
  ModerationReviewDto,
  PagedResult,
  RejectPostRequest,
  RevisionReviewDto,
  UpdateCategoryRequest,
  UserProfileDto,
  UserRole,
} from "./types";

const enc = encodeURIComponent;
const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});

// ---------------------------------------------------------------------------
// Moderation
// ---------------------------------------------------------------------------

export interface PendingParams {
  page?: number | undefined;
  pageSize?: number | undefined;
  categoryId?: string | undefined;
}

/** GET /api/admin/moderation/pending — posts with status PendingReview. */
export function listPendingPosts(params: PendingParams, signal?: AbortSignal) {
  return api.get<PagedResult<ModerationPostDto>>("/api/admin/moderation/pending", {
    query: { page: params.page, pageSize: params.pageSize, categoryId: params.categoryId },
    auth: "required",
    ...withSignal(signal),
  });
}

/** GET /api/admin/moderation/{postId} — full content + review history. */
export function getPostForReview(postId: string, signal?: AbortSignal) {
  return api.get<ModerationPostDetailDto>(`/api/admin/moderation/${enc(postId)}`, {
    auth: "required",
    ...withSignal(signal),
  });
}

/** GET /api/admin/moderation/{postId}/history. */
export function getModerationHistory(postId: string, signal?: AbortSignal) {
  return api.get<ModerationReviewDto[]>(`/api/admin/moderation/${enc(postId)}/history`, {
    auth: "required",
    ...withSignal(signal),
  });
}

/** POST /api/admin/moderation/{postId}/approve — PendingReview -> Approved. */
export function approvePost(postId: string, body: ApprovePostRequest = {}) {
  return api.post<void>(`/api/admin/moderation/${enc(postId)}/approve`, body, { auth: "required" });
}

/** POST /api/admin/moderation/{postId}/reject — reason required. */
export function rejectPost(postId: string, body: RejectPostRequest) {
  return api.post<void>(`/api/admin/moderation/${enc(postId)}/reject`, body, { auth: "required" });
}

// ---------------------------------------------------------------------------
// Revisions (proposed edits to approved posts)
// ---------------------------------------------------------------------------

/** GET /api/admin/moderation/revisions/pending — oldest first. */
export function listPendingRevisions(params: { page?: number; pageSize?: number }, signal?: AbortSignal) {
  return api.get<PagedResult<RevisionReviewDto>>("/api/admin/moderation/revisions/pending", {
    query: { page: params.page, pageSize: params.pageSize },
    auth: "required",
    ...withSignal(signal),
  });
}

/** POST .../revisions/{revisionId}/approve — the revision replaces the live content. */
export function approveRevision(revisionId: string, body: ApprovePostRequest = {}) {
  return api.post<void>(`/api/admin/moderation/revisions/${enc(revisionId)}/approve`, body, { auth: "required" });
}

/** POST .../revisions/{revisionId}/reject — reason required; the live post is unchanged. */
export function rejectRevision(revisionId: string, body: RejectPostRequest) {
  return api.post<void>(`/api/admin/moderation/revisions/${enc(revisionId)}/reject`, body, { auth: "required" });
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

/** GET /api/admin/categories — every category, active and inactive. */
export function listAdminCategories(signal?: AbortSignal) {
  return api.get<CategoryAdminDto[]>("/api/admin/categories", { auth: "required", ...withSignal(signal) });
}

/** POST /api/admin/categories — returns the new category id. */
export function createCategory(body: CreateCategoryRequest) {
  return api.post<string>("/api/admin/categories", body, { auth: "required" });
}

export function updateCategory(id: string, body: UpdateCategoryRequest) {
  return api.put<void>(`/api/admin/categories/${enc(id)}`, body, { auth: "required" });
}

export function activateCategory(id: string) {
  return api.post<void>(`/api/admin/categories/${enc(id)}/activate`, undefined, { auth: "required" });
}

export function deactivateCategory(id: string) {
  return api.post<void>(`/api/admin/categories/${enc(id)}/deactivate`, undefined, { auth: "required" });
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface AdminUsersParams {
  /** NOTE: this endpoint uses `pageNumber`, not `page`. */
  pageNumber?: number | undefined;
  pageSize?: number | undefined;
  role?: UserRole | undefined;
  isActive?: boolean | undefined;
}

/** GET /api/admin/users. There is no search parameter on this endpoint. */
export function listUsers(params: AdminUsersParams, signal?: AbortSignal) {
  return api.get<PagedResult<UserProfileDto>>("/api/admin/users", {
    query: {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      role: params.role,
      isActive: params.isActive,
    },
    auth: "required",
    ...withSignal(signal),
  });
}

export function activateUser(id: string) {
  return api.post<void>(`/api/admin/users/${enc(id)}/activate`, undefined, { auth: "required" });
}

/** 409 when an admin tries to deactivate themselves. */
export function deactivateUser(id: string) {
  return api.post<void>(`/api/admin/users/${enc(id)}/deactivate`, undefined, { auth: "required" });
}

// ---------------------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------------------

export interface AuditParams {
  page?: number | undefined;
  pageSize?: number | undefined;
  action?: string | undefined;
  entityName?: string | undefined;
}

export function listAuditLogs(params: AuditParams, signal?: AbortSignal) {
  return api.get<PagedResult<AuditLogDto>>("/api/admin/audit-logs", {
    query: { page: params.page, pageSize: params.pageSize, action: params.action, entityName: params.entityName },
    auth: "required",
    ...withSignal(signal),
  });
}
