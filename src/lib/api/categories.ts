// Category read endpoint + enrichment.
//
// The backend CategoryDto exposes only { id, name, description } and GUID ids.
// The UI wants two extras the backend does not provide: a visual `group`
// (material / immaterial) and an English name. We recover both by matching the
// backend category's Arabic `name` against the project's static taxonomy, and
// fall back gracefully for any category the taxonomy doesn't know.

import { api } from "./client";
import type { CategoryDto } from "./types";
import { categories as staticCategories, type CategoryGroup } from "@/data/categories";

export interface EnrichedCategory extends CategoryDto {
  /** Frontend-only visual grouping. Never sent to the backend. */
  group: CategoryGroup;
  /** Frontend-only English display name. Never sent to the backend. */
  nameEn: string;
}

/** GET /api/categories — active categories only (backend-filtered). */
export function listCategories(signal?: AbortSignal): Promise<CategoryDto[]> {
  return api.get<CategoryDto[]>("/api/categories", { ...(signal ? { signal } : {}) });
}

const staticByName = new Map(staticCategories.map((c) => [c.name, c]));

/** Attach `group` + `nameEn` by matching the Arabic name; fall back for unknown categories. */
export function enrichCategory(dto: CategoryDto): EnrichedCategory {
  const match = staticByName.get(dto.name);
  return {
    ...dto,
    group: match?.group ?? "immaterial",
    nameEn: match?.nameEn ?? dto.name,
  };
}

export interface CategoryIndex {
  all: EnrichedCategory[];
  byId: Map<string, EnrichedCategory>;
  groups: Record<CategoryGroup, EnrichedCategory[]>;
  /** Resolve a category's display name by id in the chosen language ("" if unknown). */
  name: (id: string, lang: "ar" | "en") => string;
}

/** Build a lookup index (by id, grouped) from a list of backend categories. */
export function buildCategoryIndex(dtos: CategoryDto[]): CategoryIndex {
  const all = dtos.map(enrichCategory);
  const byId = new Map(all.map((c) => [c.id, c]));
  const groups: Record<CategoryGroup, EnrichedCategory[]> = { material: [], immaterial: [] };
  for (const category of all) groups[category.group].push(category);
  const name = (id: string, lang: "ar" | "en"): string => {
    const category = byId.get(id);
    if (!category) return "";
    return lang === "en" ? category.nameEn : category.name;
  };
  return { all, byId, groups, name };
}
