import { getArticles } from "@/data/articles";
import { categories } from "@/data/categories";

export interface SiteStats {
  articles: number;
  categories: number;
  /** null = unknown. The backend guide has no public user-count endpoint yet. */
  members: number | null;
}

/**
 * getSiteStats: the numbers shown on the About page.
 * Articles and categories are real. Members needs the backend
 * (a public count of registered users); until then it stays null and is hidden.
 */
export async function getSiteStats(): Promise<SiteStats> {
  const published = await getArticles({ sort: "newest", page: 1, pageSize: 1 });
  return { articles: published.totalCount, categories: categories.length, members: null };
}