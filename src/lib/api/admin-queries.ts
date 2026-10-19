// TanStack Query hooks for the admin console. All are client-only and should
// be enabled only once the viewer is known to be an Admin.

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import {
  getPostForReview,
  listAdminCategories,
  listAuditLogs,
  listPendingPosts,
  listPendingRevisions,
  listUsers,
  type AdminUsersParams,
  type AuditParams,
  type PendingParams,
} from "./admin";
import { queryKeys } from "./queries";

const isBrowser = typeof window !== "undefined";

export const adminKeys = {
  pending: (params: PendingParams) => ["admin", "pending", params] as const,
  revisions: (page: number) => ["admin", "revisions", page] as const,
  review: (postId: string) => ["admin", "review", postId] as const,
  categories: ["admin", "categories"] as const,
  users: (params: AdminUsersParams) => ["admin", "users", params] as const,
  audit: (params: AuditParams) => ["admin", "audit", params] as const,
};

export function usePendingPosts(params: PendingParams, enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.pending(params),
    queryFn: ({ signal }) => listPendingPosts(params, signal),
    placeholderData: keepPreviousData,
    enabled: isBrowser && enabled,
  });
}

/** Pending revisions (proposed edits to approved posts). */
export function usePendingRevisions(page: number, pageSize: number, enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.revisions(page),
    queryFn: ({ signal }) => listPendingRevisions({ page, pageSize }, signal),
    placeholderData: keepPreviousData,
    enabled: isBrowser && enabled,
  });
}

/** Full text + review history; only fetched when an admin expands a card. */
export function usePostForReview(postId: string, enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.review(postId),
    queryFn: ({ signal }) => getPostForReview(postId, signal),
    enabled: isBrowser && enabled,
  });
}

export function useAdminCategories(enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.categories,
    queryFn: ({ signal }) => listAdminCategories(signal),
    enabled: isBrowser && enabled,
  });
}

export function useAdminUsers(params: AdminUsersParams, enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: ({ signal }) => listUsers(params, signal),
    placeholderData: keepPreviousData,
    enabled: isBrowser && enabled,
  });
}

export function useAuditLogs(params: AuditParams, enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.audit(params),
    queryFn: ({ signal }) => listAuditLogs(params, signal),
    placeholderData: keepPreviousData,
    enabled: isBrowser && enabled,
  });
}

/**
 * Refreshes everything an admin action can change. Moderation and category
 * changes also affect public lists, the stats counter, and authors' dashboards.
 */
export function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return useCallback(
    (scope: "moderation" | "categories" | "users") => {
      const keys: (readonly unknown[])[] = [["admin"]];
      if (scope === "moderation") keys.push(["posts"], ["my-posts"], queryKeys.siteStats);
      if (scope === "categories") keys.push(queryKeys.categories, ["posts"], queryKeys.siteStats);
      return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
    [queryClient],
  );
}
