// Heritage post endpoints: public discovery, the owner's dashboard, and the
// draft lifecycle (create -> update -> submit, archive, delete, revisions).

import { api } from "./client";
import type {
  CreateHeritagePostRequest,
  CreateRevisionRequest,
  HeritagePostDto,
  HeritagePostStatus,
  PagedResult,
  PostSort,
  UpdateHeritagePostRequest,
} from "./types";

const postPath = (id: string) => `/api/heritage-posts/${encodeURIComponent(id)}`;

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export interface PublicPostsParams {
  search?: string | undefined;
  /** Single backend category GUID. The backend does not support multi/group filtering. */
  categoryId?: string | undefined;
  sort?: PostSort | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

/** GET /api/heritage-posts — approved, public, non-deleted posts only (backend-enforced). */
export function listPublicPosts(
  params: PublicPostsParams,
  signal?: AbortSignal,
): Promise<PagedResult<HeritagePostDto>> {
  const { search, categoryId, sort, page, pageSize } = params;
  return api.get<PagedResult<HeritagePostDto>>("/api/heritage-posts", {
    query: { search, categoryId, sort, page, pageSize },
    auth: "optional",
    ...(signal ? { signal } : {}),
  });
}

/**
 * GET /api/heritage-posts/{id}. Approved posts are public; the author (or an
 * admin) can also read their own unpublished post, so the token is attached
 * when available. 404 covers both "missing" and "hidden".
 */
export function getPublicPost(id: string, signal?: AbortSignal): Promise<HeritagePostDto> {
  return api.get<HeritagePostDto>(postPath(id), {
    auth: "optional",
    ...(signal ? { signal } : {}),
  });
}

export interface MyPostsParams {
  page?: number | undefined;
  /** 1–100 (backend bound). */
  pageSize?: number | undefined;
  status?: HeritagePostStatus | undefined;
  search?: string | undefined;
}

/** GET /api/users/me/heritage-posts — every non-deleted post of the current user, any status. */
export function listMyPosts(
  params: MyPostsParams,
  signal?: AbortSignal,
): Promise<PagedResult<HeritagePostDto>> {
  const { page, pageSize, status, search } = params;
  return api.get<PagedResult<HeritagePostDto>>("/api/users/me/heritage-posts", {
    query: { page, pageSize, status, search },
    auth: "required",
    ...(signal ? { signal } : {}),
  });
}

// ---------------------------------------------------------------------------
// Draft lifecycle (all require a signed-in owner)
// ---------------------------------------------------------------------------

/** POST /api/heritage-posts — creates a Draft (status 0). Returns the new post id. */
export async function createDraft(body: CreateHeritagePostRequest): Promise<string> {
  const created = await api.post<{ id: string }>("/api/heritage-posts", body, { auth: "required" });
  return created.id;
}

/** PUT /api/heritage-posts/{id} — edits a Draft (409 for other states). */
export function updateDraft(id: string, body: UpdateHeritagePostRequest): Promise<void> {
  return api.put<void>(postPath(id), body, { auth: "required" });
}

/** POST /api/heritage-posts/{id}/submit — Draft/Rejected -> PendingReview. */
export function submitPost(id: string): Promise<void> {
  return api.post<void>(`${postPath(id)}/submit`, undefined, { auth: "required" });
}

/** POST /api/heritage-posts/{id}/revisions — proposes changes to an Approved post. */
export function createRevision(id: string, body: CreateRevisionRequest): Promise<void> {
  return api.post<void>(`${postPath(id)}/revisions`, body, { auth: "required" });
}

/** POST /api/heritage-posts/{id}/archive — Approved -> Archived (drops out of public lists). */
export function archivePost(id: string): Promise<void> {
  return api.post<void>(`${postPath(id)}/archive`, undefined, { auth: "required" });
}

/** DELETE /api/heritage-posts/{id} — soft delete (the post then 404s everywhere). */
export function deletePost(id: string): Promise<void> {
  return api.del<void>(postPath(id), { auth: "required" });
}
