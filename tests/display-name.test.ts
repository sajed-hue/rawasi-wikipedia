import { describe, expect, test } from "bun:test";

import { DISPLAY_NAME_MAX_LENGTH, normalizeDisplayName } from "../src/lib/display-name";

describe("normalizeDisplayName", () => {
  test("trims and collapses inner whitespace", () => {
    expect(normalizeDisplayName("  ساجد   قطناني \n")).toBe("ساجد قطناني");
  });

  test("returns null for empty or whitespace-only input", () => {
    expect(normalizeDisplayName("")).toBeNull();
    expect(normalizeDisplayName("   \t ")).toBeNull();
    expect(normalizeDisplayName(undefined)).toBeNull();
    expect(normalizeDisplayName(null)).toBeNull();
  });

  test("caps at the backend limit without splitting a character", () => {
    const long = "😀".repeat(DISPLAY_NAME_MAX_LENGTH + 20);
    const result = normalizeDisplayName(long)!;
    expect(Array.from(result)).toHaveLength(DISPLAY_NAME_MAX_LENGTH);
    expect(result).toBe("😀".repeat(DISPLAY_NAME_MAX_LENGTH));
  });

  test("keeps a name exactly at the limit", () => {
    const exact = "أ".repeat(DISPLAY_NAME_MAX_LENGTH);
    expect(normalizeDisplayName(exact)).toBe(exact);
  });
});
