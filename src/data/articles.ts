/**
 * Articles shaped like the backend article DTO.
 * status: 0 Draft, 1 Pending review, 2 Approved, 3 Rejected, 4 Archived.
 * Every article comes from users and admins and is kept in the browser's
 * storage for now. Later, the backend replaces all of this.
 */
export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  categoryId: string;
  authorId: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string | undefined; // optional; articles without a photo show a placeholder
}

// No built-in articles: only what users and admins create.
export const articles: Article[] = [];

export type ArticleSort = "newest" | "oldest" | "title";

export interface GetArticlesParams {
  search?: string;
  categoryId?: string | string[] | undefined;
  sort?: ArticleSort;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * getArticles: the public list (approved articles only), with search,
 * category filter, sorting and pagination.
 * Later this becomes: GET /api/heritage-posts
 */
export async function getArticles({
  search = "",
  categoryId,
  sort = "newest",
  page = 1,
  pageSize = 9,
}: GetArticlesParams): Promise<PagedResult<Article>> {
  const q = search.trim().toLowerCase();
  const ids = categoryId ? (Array.isArray(categoryId) ? categoryId : [categoryId]) : null;
  let list = getAllArticles().filter(
    (x) =>
      x.status === 2 &&
      (!ids || ids.includes(x.categoryId)) &&
      (!q || x.title.toLowerCase().includes(q) || x.summary.toLowerCase().includes(q)),
  );
  list = [...list].sort((x, y) =>
    sort === "title"
      ? x.title.localeCompare(y.title, "ar")
      : sort === "oldest"
        ? x.createdAt.localeCompare(y.createdAt)
        : y.createdAt.localeCompare(x.createdAt),
  );
  const totalCount = list.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const p = Math.min(Math.max(1, page), totalPages);
  return {
    items: list.slice((p - 1) * pageSize, p * pageSize),
    page: p,
    pageSize,
    totalCount,
    totalPages,
  };
}

/**
 * getArticleById: finds one article by its id.
 * Only approved articles (status 2) are visible to the public.
 * Later this becomes: GET /api/heritage-posts/{id}
 */
export async function getArticleById(id: string): Promise<Article | null> {
  return getAllArticles().find((x) => x.id === id && x.status === 2) ?? null;
}

// ---------------------------------------------------------------------------
// Stored articles (mock). Articles are kept in the browser's storage so they
// survive a refresh. Later, the backend replaces all of this.
// ---------------------------------------------------------------------------
const SUBMITTED_KEY = "rawasi-mock-submitted";

/** Reads the stored articles from the browser (empty on the server). */
function loadSubmitted(): Article[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SUBMITTED_KEY);
    return raw ? (JSON.parse(raw) as Article[]) : [];
  } catch {
    return [];
  }
}

/**
 * Saves the list of articles to the browser.
 * Throws if the browser storage is full, so the form can show an error
 * instead of silently losing the article.
 */
function saveSubmitted(list: Article[]) {
  localStorage.setItem(SUBMITTED_KEY, JSON.stringify(list));
}

/** All articles: the built-in ones (none now) plus everything users created. */
export function getAllArticles(): Article[] {
  return [...articles, ...loadSubmitted()];
}

export interface NewArticleInput {
  title: string;
  summary: string;
  content: string;
  categoryId: string;
  imageUrl?: string | undefined;
}

/**
 * createArticle: creates a new article as a Draft (status 0), like the backend.
 * Later this becomes: POST /api/heritage-posts
 */
export async function createArticle(input: NewArticleInput): Promise<Article> {
  const today = new Date().toISOString().slice(0, 10);
  const article: Article = {
    id: crypto.randomUUID(), // GUID, same format the backend uses
    ...input,
    authorId: "user-1", // placeholder until real users exist
    status: 0,
    createdAt: today,
    updatedAt: today,
  };
  saveSubmitted([...loadSubmitted(), article]);
  return article;
}

/**
 * submitArticle: sends a Draft or Rejected article for admin review
 * (status 0 or 3 -> 1, Pending).
 * Later this becomes: POST /api/heritage-posts/{id}/submit
 */
export async function submitArticle(id: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  saveSubmitted(
    loadSubmitted().map((x) =>
      x.id === id && (x.status === 0 || x.status === 3) ? { ...x, status: 1, updatedAt: today } : x,
    ),
  );
}

// ---------------------------------------------------------------------------
// Moderation (mock). Admins review articles that are Pending (status 1).
// ---------------------------------------------------------------------------
const REVIEWS_KEY = "rawasi-mock-reviews";

export interface ModerationReview {
  postId: string;
  decision: 0 | 1; // 0 = approved, 1 = rejected (same numbers as the backend)
  reason: string;
  createdAt: string;
}

function loadReviews(): ModerationReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    return raw ? (JSON.parse(raw) as ModerationReview[]) : [];
  } catch {
    return [];
  }
}

function saveReviews(list: ModerationReview[]) {
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(list));
  } catch {
    // ignore: storage unavailable
  }
}

/**
 * getPendingArticles: the admin queue, all articles waiting for review.
 * Later this becomes: GET /api/admin/moderation/pending
 */
export async function getPendingArticles(): Promise<Article[]> {
  return loadSubmitted().filter((x) => x.status === 1);
}

/** Moves a pending article to a new status and records the decision. */
async function moderate(id: string, status: 2 | 3, decision: 0 | 1, reason: string) {
  const today = new Date().toISOString().slice(0, 10);
  saveSubmitted(
    loadSubmitted().map((x) =>
      x.id === id && x.status === 1 ? { ...x, status, updatedAt: today } : x,
    ),
  );
  saveReviews([...loadReviews(), { postId: id, decision, reason, createdAt: today }]);
}

/**
 * approveArticle: Pending -> Approved (2). The reason is optional.
 * Later this becomes: POST /api/admin/moderation/{id}/approve
 */
export async function approveArticle(id: string, reason = ""): Promise<void> {
  await moderate(id, 2, 0, reason);
}

/**
 * rejectArticle: Pending -> Rejected (3). A reason is required.
 * Later this becomes: POST /api/admin/moderation/{id}/reject
 */
export async function rejectArticle(id: string, reason: string): Promise<void> {
  await moderate(id, 3, 1, reason);
}

/**
 * getMyArticles: the articles one user submitted, newest first, any status.
 * Later this becomes: GET /api/users/me/heritage-posts
 */
export async function getMyArticles(authorId: string): Promise<Article[]> {
  return [...loadSubmitted()]
    .reverse()
    .filter((x) => x.authorId === authorId && x.status !== 4)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * getMyArticleById: finds one stored article in any status.
 * Used by the edit form. (The public getArticleById only returns approved ones.)
 */
export async function getMyArticleById(id: string): Promise<Article | null> {
  return loadSubmitted().find((x) => x.id === id) ?? null;
}

/**
 * updateArticle: changes a Draft (0) or Rejected (3) article.
 * The backend refuses edits to pending or approved articles, so does this.
 * imageUrl: a new image replaces the old one; "" removes the image;
 * leaving it out keeps the current image.
 * Later this becomes: PUT /api/heritage-posts/{id}
 */
export async function updateArticle(id: string, input: NewArticleInput): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  saveSubmitted(
    loadSubmitted().map((x) => {
      if (x.id !== id || (x.status !== 0 && x.status !== 3)) return x;
      const next: Article = {
        ...x,
        title: input.title,
        summary: input.summary,
        content: input.content,
        categoryId: input.categoryId,
        updatedAt: today,
      };
      if (input.imageUrl !== undefined) {
        next.imageUrl = input.imageUrl === "" ? undefined : input.imageUrl;
      }
      return next;
    }),
  );
}

/**
 * deleteArticle: removes an article. (The backend does a "soft delete",
 * hiding it everywhere; here it is simply removed.)
 * Later this becomes: DELETE /api/heritage-posts/{id}
 */
export async function deleteArticle(id: string): Promise<void> {
  saveSubmitted(loadSubmitted().filter((x) => x.id !== id));
}