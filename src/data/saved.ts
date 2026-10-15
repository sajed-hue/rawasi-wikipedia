import { getAllArticles, type Article } from "@/data/articles";

// Saved articles (mock). The backend has no "saved" feature, so the list is
// kept in the browser: it survives a refresh but only exists on this device.
const SAVED_KEY = "rawasi-mock-saved";

/** getSavedIds: the ids of saved articles, newest saved first. */
export function getSavedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** toggleSaved: saves the article, or removes it if already saved. Returns the new list. */
export function toggleSaved(id: string): string[] {
  const current = getSavedIds();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [id, ...current];
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  } catch {
    // ignore: storage unavailable
  }
  return next;
}

/** getSavedArticles: the saved articles that still exist and are approved. */
export async function getSavedArticles(): Promise<Article[]> {
  const approved = getAllArticles().filter((a) => a.status === 2);
  return getSavedIds()
    .map((id) => approved.find((a) => a.id === id))
    .filter((a): a is Article => a !== undefined);
}