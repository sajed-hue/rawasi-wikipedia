/** Backend rule (UpdateCurrentUserCommandValidator): DisplayName is required, max 100 chars. */
export const DISPLAY_NAME_MAX_LENGTH = 100;

/**
 * Trims and collapses whitespace, and caps the name at the backend's limit (by code point,
 * so an Arabic or emoji character is never cut in half). Returns null when nothing is left.
 */
export function normalizeDisplayName(raw: string | null | undefined): string | null {
  const name = (raw ?? "").replace(/\s+/g, " ").trim();
  if (!name) return null;
  return Array.from(name).slice(0, DISPLAY_NAME_MAX_LENGTH).join("").trim();
}
