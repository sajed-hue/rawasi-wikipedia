/**
 * Canonical category list for رواسي / Rawasi.
 *
 * Each entry matches the backend `categoryDto` shape (`id`, `name`,
 * `description`) plus two frontend-only fields: `group` (visual grouping)
 * and `nameEn` (English display name). Neither is ever sent to the backend.
 */

export type CategoryGroup = "material" | "immaterial";
type Lang = "ar" | "en";

/** Shape mirrored from the backend `categoryDto`. */
export interface CategoryDto {
  id: string;
  name: string;
  description: string;
}

/** A selectable category: `categoryDto` + frontend-only fields. */
export interface Category extends CategoryDto {
  /** Frontend-only visual grouping key. Never sent to the backend. */
  group: CategoryGroup;
  /** Frontend-only English name. Never sent to the backend. */
  nameEn: string;
}

/** Display labels for the frontend grouping. Never sent anywhere. */
export const CATEGORY_GROUP_LABELS: Record<CategoryGroup, string> = {
  material: "التراث المادي (الملموس)",
  immaterial: "التراث غير المادي (اللامادي)",
};

export const CATEGORY_GROUP_LABELS_EN: Record<CategoryGroup, string> = {
  material: "Tangible heritage",
  immaterial: "Intangible heritage",
};

export const categories: Category[] = [
  {
    id: "mat-1",
    name: "العمارة والآثار",
    nameEn: "Architecture & Antiquities",
    description:
      "القصور الأثرية، المساجد والكنائس التاريخية، البيوت القديمة في البلدات العتيقة، القلاع والأسوار",
    group: "material",
  },
  {
    id: "mat-2",
    name: "المقتنيات والأدوات اليومية",
    nameEn: "Everyday Objects & Tools",
    description: "الأدوات الفخارية، النحاسيات، وبقايا الأدوات الزراعية القديمة",
    group: "material",
  },
  {
    id: "mat-3",
    name: "الأزياء والحلي",
    nameEn: "Dress & Jewellery",
    description:
      "الثوب الفلسطيني المطرز، الكوفية الفلسطينية، الحلي الفضية والذهبية التقليدية",
    group: "material",
  },
  {
    id: "imm-1",
    name: "الفنون الشعبية",
    nameEn: "Folk Arts",
    description:
      "الدبكة الفلسطينية، أغاني الفرح والأهازيج، الزجل الشعبي، العزف على الآلات التراثية",
    group: "immaterial",
  },
  {
    id: "imm-2",
    name: "الأدب الشفوي والقصصي",
    nameEn: "Oral Storytelling & Literature",
    description: "الحكاية الشعبية، الأمثال الشعبية، الألغاز (التناقير)",
    group: "immaterial",
  },
  {
    id: "imm-3",
    name: "العادات والتقاليد الاجتماعية",
    nameEn: "Social Customs & Traditions",
    description:
      "طقوس العزاء والفرح، عادات الجاهة والصلح العشائري، مواسم العونة",
    group: "immaterial",
  },
  {
    id: "imm-4",
    name: "المهارات والحرف التقليدية",
    nameEn: "Traditional Crafts & Skills",
    description:
      "صناعة الصابون النابلسي، حفر خشب الزيتون، صناعة الزجاج والخزف، غزل السجاد والنسيج",
    group: "immaterial",
  },
  {
    id: "imm-5",
    name: "المطبخ الفلسطيني التقليدي",
    nameEn: "Traditional Palestinian Cuisine",
    description: "المسخن، المقلوبة، المفتول، الكنافة النابلسية، القدرة الخليلية",
    group: "immaterial",
  },
];

/** Categories belonging to one frontend group, in declaration order. */
export function categoriesByGroup(group: CategoryGroup): Category[] {
  return categories.filter((category) => category.group === group);
}

/** The category's name in the chosen language. */
export function categoryLabel(category: Category, lang: Lang): string {
  return lang === "en" ? category.nameEn : category.name;
}

/** Looks a category up by id and returns its name in the chosen language. */
export function categoryNameById(id: string, lang: Lang): string {
  const category = categories.find((c) => c.id === id);
  return category ? categoryLabel(category, lang) : "";
}

/** The group's label in the chosen language. */
export function groupLabel(group: CategoryGroup, lang: Lang): string {
  return lang === "en" ? CATEGORY_GROUP_LABELS_EN[group] : CATEGORY_GROUP_LABELS[group];
}