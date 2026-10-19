import { listCategories } from "@/lib/api/categories";
import { listPublicPosts } from "@/lib/api/posts";

export interface SiteStats {
  articles: number;
  categories: number;
  /** null = unknown. The backend has no public user-count endpoint yet. */
  members: number | null;
}

/**
 * getSiteStats: the numbers shown on the About page, from the live backend.
 * `articles` is the public post total; `categories` is the count of active
 * categories. `members` needs a public user-count endpoint the backend does
 * not expose yet, so it stays null and is hidden by the UI.
 */
export async function getSiteStats(): Promise<SiteStats> {
  const [posts, categories] = await Promise.all([
    listPublicPosts({ page: 1, pageSize: 1 }),
    listCategories(),
  ]);
  return { articles: posts.totalCount, categories: categories.length, members: null };
}