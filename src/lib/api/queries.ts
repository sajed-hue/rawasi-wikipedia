// TanStack Query hooks + query-key registry.
//
// Queries are gated to the browser (`enabled: isBrowser`) so SSR renders the
// loading state instead of fetching the backend during server render.
// Caching, cancellation (AbortSignal), and keepPreviousData pagination come for
// free from React Query, per the integration guide.

import { keepPreviousData, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { buildCategoryIndex, listCategories, type CategoryIndex } from "./categories";
import { listPostMedia } from "./media";
import {
  getPublicPost,
  listMyPosts,
  listPublicPosts,
  type MyPostsParams,
  type PublicPostsParams,
} from "./posts";
import {
  HeritagePostStatus,
  type CategoryDto,
  type HeritagePostDto,
  type PagedResult,
  type PostMediaDto,
} from "./types";
import { getSiteStats, type SiteStats } from "@/data/stats";

const isBrowser = typeof window !== "undefined";

export const queryKeys = {
  posts: {
    list: (params: PublicPostsParams) => ["posts", "list", params] as const,
    detail: (id: string) => ["posts", "detail", id] as const,
  },
  myPosts: (params: MyPostsParams) => ["my-posts", params] as const,
  categories: ["categories"] as const,
  media: (postId: string) => ["media", postId] as const,
  siteStats: ["site-stats"] as const,
};

/** Paginated public post list. Keeps the previous page visible while the next loads. */
export function usePublicPosts(params: PublicPostsParams) {
  return useQuery<PagedResult<HeritagePostDto>>({
    queryKey: queryKeys.posts.list(params),
    queryFn: ({ signal }) => listPublicPosts(params, signal),
    placeholderData: keepPreviousData,
    enabled: isBrowser,
  });
}

/** Single post (public, or the owner's own unpublished post). 404 => ApiError "notFound". */
export function usePublicPost(id: string, enabled = true) {
  return useQuery<HeritagePostDto>({
    queryKey: queryKeys.posts.detail(id),
    queryFn: ({ signal }) => getPublicPost(id, signal),
    enabled: isBrowser && enabled && id.length > 0,
  });
}

/** The signed-in user's own posts (any status). Pass `enabled` = isLoggedIn. */
export function useMyPosts(params: MyPostsParams, enabled = true) {
  return useQuery<PagedResult<HeritagePostDto>>({
    queryKey: queryKeys.myPosts(params),
    queryFn: ({ signal }) => listMyPosts(params, signal),
    enabled: isBrowser && enabled,
  });
}

/**
 * Bookmarked posts, fetched by id. Saved ids live in the browser (the backend
 * has no "saved" feature); ids that 404 or are no longer approved are dropped.
 */
export function useSavedPosts(ids: string[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.posts.detail(id),
      queryFn: ({ signal }: { signal: AbortSignal }) => getPublicPost(id, signal),
      enabled: isBrowser,
    })),
    combine: (results) => ({
      posts: results.flatMap((r) =>
        r.data && r.data.status === HeritagePostStatus.Approved ? [r.data] : [],
      ),
      isLoading: results.some((r) => r.isLoading),
    }),
  });
}

/** Raw active categories. */
export function useCategoriesQuery() {
  return useQuery<CategoryDto[]>({
    queryKey: queryKeys.categories,
    queryFn: ({ signal }) => listCategories(signal),
    staleTime: 5 * 60_000,
    enabled: isBrowser,
  });
}

/** Categories as a lookup index (by id, grouped, with language-aware names). */
export function useCategoryIndex(): {
  index: CategoryIndex;
  isLoading: boolean;
  isError: boolean;
} {
  const query = useCategoriesQuery();
  const index = useMemo(() => buildCategoryIndex(query.data ?? []), [query.data]);
  return { index, isLoading: query.isLoading, isError: query.isError };
}

/** Media metadata for a post. */
export function usePostMedia(postId: string, enabled = true) {
  return useQuery<PostMediaDto[]>({
    queryKey: queryKeys.media(postId),
    queryFn: ({ signal }) => listPostMedia(postId, signal),
    enabled: isBrowser && enabled && postId.length > 0,
  });
}

/**
 * Site-wide counts (published posts, active categories) for the About page.
 * Auto-refreshes: polls every 30s and refetches when the tab regains focus.
 */
export function useSiteStats() {
  return useQuery<SiteStats>({
    queryKey: queryKeys.siteStats,
    queryFn: () => getSiteStats(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    enabled: isBrowser,
  });
}

/**
 * Returns a function that refreshes everything a post mutation can affect:
 * the owner's list, public lists/details, the live stats counter, and (when a
 * post id is given) that post's media.
 */
export function useInvalidatePosts() {
  const queryClient = useQueryClient();
  return useCallback(
    (postId?: string) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-posts"] }),
        queryClient.invalidateQueries({ queryKey: ["posts"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.siteStats }),
        ...(postId ? [queryClient.invalidateQueries({ queryKey: queryKeys.media(postId) })] : []),
      ]),
    [queryClient],
  );
}
