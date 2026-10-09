/**
 * Canonical category list for رواسي / Rawasi.
 *
 * Each entry matches the backend `categoryDto` shape (`id`, `name`,
 * `description`) plus one frontend-only field, `group`, used purely for
 * visual organization. `group` (and the group labels below) must never be
 * sent to the backend.
 */

export type CategoryGroup = "material" | "immaterial";

/** Shape mirrored from the backend `categoryDto`. */
export interface CategoryDto {
  id: string;
  name: string;
  description: string;
}

/** A selectable category: `categoryDto` + frontend-only `group`. */
export interface Category extends CategoryDto {
  /** Frontend-only visual grouping key. Never sent to the backend. */
  group: CategoryGroup;
}

/**
 * Display labels for the frontend grouping. Never sent anywhere.
 */
export const CATEGORY_GROUP_LABELS: Record<CategoryGroup, string> = {
  material: "التراث المادي (الملموس)",
  immaterial: "التراث غير المادي (اللامادي)",
};

export const categories: Category[] = [
  {
    id: "mat-1",
    name: "العمارة والآثار",
    description:
      "القصور الأثرية، المساجد والكنائس التاريخية، البيوت القديمة في البلدات العتيقة، القلاع والأسوار",
    group: "material",
  },
  {
    id: "mat-2",
    name: "المقتنيات والأدوات اليومية",
    description: "الأدوات الفخارية، النحاسيات، وبقايا الأدوات الزراعية القديمة",
    group: "material",
  },
  {
    id: "mat-3",
    name: "الأزياء والحلي",
    description:
      "الثوب الفلسطيني المطرز، الكوفية الفلسطينية، الحلي الفضية والذهبية التقليدية",
    group: "material",
  },
  {
    id: "imm-1",
    name: "الفنون الشعبية",
    description:
      "الدبكة الفلسطينية، أغاني الفرح والأهازيج، الزجل الشعبي، العزف على الآلات التراثية",
    group: "immaterial",
  },
  {
    id: "imm-2",
    name: "الأدب الشفوي والقصصي",
    description: "الحكاية الشعبية، الأمثال الشعبية، الألغاز (التناقير)",
    group: "immaterial",
  },
  {
    id: "imm-3",
    name: "العادات والتقاليد الاجتماعية",
    description:
      "طقوس العزاء والفرح، عادات الجاهة والصلح العشائري، مواسم العونة",
    group: "immaterial",
  },
  {
    id: "imm-4",
    name: "المهارات والحرف التقليدية",
    description:
      "صناعة الصابون النابلسي، حفر خشب الزيتون، صناعة الزجاج والخزف، غزل السجاد والنسيج",
    group: "immaterial",
  },
  {
    id: "imm-5",
    name: "المطبخ الفلسطيني التقليدي",
    description: "المسخن، المقلوبة، المفتول، الكنافة النابلسية، القدرة الخليلية",
    group: "immaterial",
  },
];

/** Categories belonging to one frontend group, in declaration order. */
export function categoriesByGroup(group: CategoryGroup): Category[] {
  return categories.filter((category) => category.group === group);
}
