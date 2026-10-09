/**
 * Mock articles shaped like the backend article DTO.
 * status: 2 = Approved. Swap getArticles() for a real API call later.
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
}

const a = (
  id: string,
  title: string,
  summary: string,
  categoryId: string,
  createdAt: string,
): Article => ({
  id,
  title,
  summary,
  content: summary,
  categoryId,
  authorId: "user-1",
  status: 2,
  createdAt,
  updatedAt: createdAt,
});

export const articles: Article[] = [
  a("art-1", "البلدة القديمة في القدس", "أزقة حجرية وأسواق عتيقة تحكي قرونًا من الحياة اليومية حول أسوار المدينة.", "mat-1", "2026-09-28"),
  a("art-2", "قلعة برقوق في خان يونس", "قلعة مملوكية شامخة كانت محطة للقوافل وحارسة لطريق الساحل.", "mat-1", "2026-07-14"),
  a("art-3", "دلة القهوة العربية", "رمز الكرم والضيافة، تتوسط المجالس وتُصبّ منها القهوة السادة للضيوف.", "mat-2", "2026-09-30"),
  a("art-4", "الرحى الحجرية", "حجران متراكبان طحنت بهما الجدات القمح والعدس في بيوت القرى.", "mat-2", "2026-06-02"),
  a("art-5", "التطريز الفلسطيني", "غرز ملونة على الأثواب تروي هوية كل مدينة وقرية وانتماءها للأرض.", "mat-3", "2026-10-01"),
  a("art-6", "الكوفية الفلسطينية", "نقوشها تحاكي شباك الصيد وأوراق الزيتون وطرق التجارة القديمة.", "mat-3", "2026-05-20"),
  a("art-7", "الدبكة الشعبية", "خطوات جماعية على إيقاع اليرغول تعبّر عن الفرح والتمسك بالأرض.", "imm-1", "2026-08-11"),
  a("art-8", "أهازيج الأعراس", "أغانٍ تتناقلها النساء في ليالي الحناء وزفة العريس.", "imm-1", "2026-04-09"),
  a("art-9", "حكايات جدّتي", "قصص الشتاء حول الموقد: الغولة والشاطر حسن وحكايات العبرة.", "imm-2", "2026-09-15"),
  a("art-10", "الأمثال الشعبية", "حكمة الأجداد مختصرة في جمل قصيرة ما زالت تتردد على الألسنة.", "imm-2", "2026-03-03"),
  a("art-11", "العونة في موسم الزيتون", "تعاون الجيران والأقارب في قطف الزيتون وبناء البيوت دون مقابل.", "imm-3", "2026-08-25"),
  a("art-12", "صناعة الفخار", "حرفة يدوية قديمة تشكّل الطين إلى جرار وأوانٍ تحفظ الماء والزيت.", "imm-4", "2026-09-05"),
  a("art-13", "الصابون النابلسي", "صابون زيت الزيتون الذي اشتهرت به مصابن نابلس منذ قرون.", "imm-4", "2026-02-18"),
  a("art-14", "المسخّن الفلسطيني", "خبز الطابون بزيت الزيتون والبصل والسماق، طبق موسم العصر.", "imm-5", "2026-07-30"),
];

export type ArticleSort = "newest" | "oldest" | "title";

export interface GetArticlesParams {
  search?: string;
  categoryId?: string | string[];
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

export async function getArticles({
  search = "",
  categoryId,
  sort = "newest",
  page = 1,
  pageSize = 9,
}: GetArticlesParams): Promise<PagedResult<Article>> {
  const q = search.trim().toLowerCase();
  const ids = categoryId ? (Array.isArray(categoryId) ? categoryId : [categoryId]) : null;
  let list = articles.filter(
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
