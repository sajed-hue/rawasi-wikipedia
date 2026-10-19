// Media endpoints + URL construction.
//
// The frontend must NEVER touch Firebase Storage directly. All media flows
// through the backend content proxy. Public (approved) posts can use the content
// URL directly in <img src>; private media (draft / pending / rejected) needs an
// authenticated blob fetch, because <img> cannot send an Authorization header.

import { api } from "./client";
import type { PostMediaDto } from "./types";

const mediaPath = (postId: string) => `/api/heritage-posts/${encodeURIComponent(postId)}/media`;

/** Client-side pre-check only (UX). The backend re-validates size, type and magic bytes. */
export const IMAGE_RULES = {
  maxBytes: 5 * 1024 * 1024,
  types: ["image/jpeg", "image/png", "image/webp"],
  accept: "image/jpeg,image/png,image/webp",
} as const;

/** Returns why a file would be rejected, or null when it passes the pre-check. */
export function validateImageFile(file: File): "type" | "size" | null {
  if (!(IMAGE_RULES.types as readonly string[]).includes(file.type)) return "type";
  if (file.size > IMAGE_RULES.maxBytes) return "size";
  return null;
}

/** GET /api/heritage-posts/{postId}/media — ordered isPrimary DESC then displayOrder ASC. */
export function listPostMedia(postId: string, signal?: AbortSignal): Promise<PostMediaDto[]> {
  return api.get<PostMediaDto[]>(mediaPath(postId), {
    auth: "optional",
    ...(signal ? { signal } : {}),
  });
}

/** Absolute URL to a media item's binary content (backend proxy). Public posts only. */
export function mediaContentUrl(postId: string, mediaId: string): string {
  const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
  return `${base}${mediaPath(postId)}/${encodeURIComponent(mediaId)}/content`;
}

/** Authenticated binary fetch, for previewing private media as an object URL. */
export function fetchMediaBlob(postId: string, mediaId: string, signal?: AbortSignal): Promise<Blob> {
  return api.getBlob(`${mediaPath(postId)}/${encodeURIComponent(mediaId)}/content`, {
    auth: "optional",
    ...(signal ? { signal } : {}),
  });
}

/** The cover image: explicit primary, else the first (already-sorted) item. */
export function pickPrimaryMedia(media: PostMediaDto[]): PostMediaDto | undefined {
  return media.find((m) => m.isPrimary) ?? media[0];
}

export interface UploadMediaOptions {
  altText?: string | undefined;
  isPrimary?: boolean | undefined;
  displayOrder?: number | undefined;
}

/**
 * POST /api/heritage-posts/{postId}/media — ONE file per request (field name
 * must be exactly "file"). Only allowed on Draft/Rejected posts. Not retried
 * automatically: uploads are not idempotent.
 */
export async function uploadPostMedia(
  postId: string,
  file: File,
  options: UploadMediaOptions = {},
  signal?: AbortSignal,
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  if (options.altText) form.append("altText", options.altText);
  form.append("isPrimary", String(options.isPrimary ?? false));
  form.append("displayOrder", String(options.displayOrder ?? 0));

  const created = await api.postForm<{ id: string }>(mediaPath(postId), form, {
    auth: "required",
    timeoutMs: 60_000,
    ...(signal ? { signal } : {}),
  });
  return created.id;
}

/** DELETE /api/heritage-posts/{postId}/media/{mediaId}. */
export function deletePostMedia(postId: string, mediaId: string): Promise<void> {
  return api.del<void>(`${mediaPath(postId)}/${encodeURIComponent(mediaId)}`, { auth: "required" });
}
