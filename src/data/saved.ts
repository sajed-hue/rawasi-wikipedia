// Saved (bookmarked) article ids. The backend has no "saved" feature, so the ids
// are kept in the browser: they survive a refresh but only exist on this device.
// The articles themselves are fetched from the API (see useSavedPosts).
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