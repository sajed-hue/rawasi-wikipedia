import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getSavedIds, toggleSaved } from "@/data/saved";
import { useMockAuth } from "@/lib/mock-auth";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Gem,
  ImageIcon,
  Landmark,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getArticles, type Article, type ArticleSort, type PagedResult } from "@/data/articles";
import {
  CATEGORY_GROUP_LABELS,
  categories,
  categoryLabel,
  groupLabel,
  categoriesByGroup,
  categoryNameById,
  type CategoryGroup,
} from "@/data/categories";
import { useLanguage } from "@/lib/i18n";

type Filter = { type: "category"; id: string } | { type: "group"; id: CategoryGroup } | null;

export const Route = createFileRoute("/explore")({
  validateSearch: (s: Record<string, unknown>): { category?: string; q?: string } => {
    const out: { category?: string; q?: string } = {};
    const category = s["category"];
    const q = s["q"];
    if (typeof category === "string") out.category = category;
    if (typeof q === "string" && q.trim() !== "") out.q = q;
    return out;
  },
  head: () => ({
    meta: [
      { title: "استكشف التراث الفلسطيني | رواسي" },
      { name: "description", content: "رحلة بين حكايات الأجداد وكنوز التراث الأصيل: تصفّح أقسام التراث المادي وغير المادي ومقالاته." },
      { property: "og:title", content: "استكشف التراث الفلسطيني | رواسي" },
      { property: "og:description", content: "تصفّح أقسام التراث الفلسطيني ومقالاته على رواسي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExplorePage,
});

const copy = {
  ar: {
    title: "استكشف التراث الفلسطيني",
    subtitle: "رحلة بين حكايات الأجداد وكنوز التراث الأصيل",
    search: "ابحث عن مقال أو موضوع تراثي",
    all: "الكل",
    count: (n: number) => `${n} مقالة`,
    newest: "الأحدث",
    oldest: "الأقدم",
    byTitle: "حسب العنوان",
    readMore: "اقرأ المزيد ←",
    empty: "لا توجد مقالات تطابق بحثك",
    save: "حفظ",
    remove: "إزالة الفلتر",
  },
  en: {
    title: "Explore Palestinian Heritage",
    subtitle: "A journey through ancestral stories and authentic heritage treasures",
    search: "Search for an article or heritage topic",
    all: "All",
    count: (n: number) => `${n} articles`,
    newest: "Newest",
    oldest: "Oldest",
    byTitle: "By title",
    readMore: "Read more →",
    empty: "No articles match your search",
    save: "Save",
    remove: "Remove filter",
  },
};

const groupIcon = { material: Landmark, immaterial: Sparkles } as const;

function ExplorePage() {
  const { lang } = useLanguage();
  const t = copy[lang];
  const { category, q } = Route.useSearch();

  const [query, setQuery] = useState(q ?? "");
  const [search, setSearch] = useState(q ?? "");
  const [filter, setFilter] = useState<Filter>(() =>
    category && categories.some((c) => c.id === category) ? { type: "category", id: category } : null,
  );
  const [sort, setSort] = useState<ArticleSort>("newest");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PagedResult<Article> | null>(null);
  
  const [saved, setSaved] = useState<string[]>([]);
  const { isLoggedIn } = useMockAuth();
  const navigate = useNavigate();

  // Load the saved article ids from the browser when the page opens.
  useEffect(() => setSaved(getSavedIds()), []);

  /** handleSave: saves or unsaves an article. Guests are sent to log in first. */
  function handleSave(id: string) {
    if (!isLoggedIn) {
      navigate({ to: "/login" });
      return;
    }
    setSaved(toggleSaved(id));
  }


  useEffect(() => {
    if (category && categories.some((c) => c.id === category)) setFilter({ type: "category", id: category });
  }, [category]);

  useEffect(() => {
    const id = setTimeout(() => setSearch(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => setPage(1), [search, filter, sort]);

  useEffect(() => {
    let alive = true;
    const categoryId =
      filter?.type === "category"
        ? filter.id
        : filter?.type === "group"
          ? categoriesByGroup(filter.id).map((c) => c.id)
          : undefined;
    getArticles({ search, categoryId, sort, page, pageSize: 9 }).then((r) => alive && setResult(r));
    return () => {
      alive = false;
    };
  }, [search, filter, sort, page]);

  const isActive = (f: Filter) => JSON.stringify(f) === JSON.stringify(filter);
  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition-colors ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-background text-foreground hover:border-primary hover:text-primary"
    }`;
    const filterLabel =
    filter?.type === "category"
      ? categoryNameById(filter.id, lang)
      : filter
        ? groupLabel(filter.id, lang)
        : null;
const catName = (id: string) => categoryNameById(id, lang);
  const PrevIcon = lang === "ar" ? ChevronRight : ChevronLeft;
  const NextIcon = lang === "ar" ? ChevronLeft : ChevronRight;
  const FirstIcon = lang === "ar" ? ChevronsRight : ChevronsLeft;
  const LastIcon = lang === "ar" ? ChevronsLeft : ChevronsRight;
  const totalPages = result?.totalPages ?? 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="text-center">
        <h1 className="font-display text-3xl text-primary sm:text-4xl">{t.title}</h1>
        <p className="mt-3 text-muted-foreground">{t.subtitle}</p>
        <div className="relative mx-auto mt-8">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            aria-label={t.search}
            className="h-12 rounded-full ps-12"
          />
        </div>
      </header>

      <section id="categories" className="mt-10 scroll-mt-24">
        <div className="mb-4">
          <button type="button" className={chip(filter === null)} onClick={() => setFilter(null)}>
            {t.all}
          </button>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {(["material", "immaterial"] as const).map((g) => {
            const Icon = groupIcon[g];
            return (
              <div key={g} className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <button
                  type="button"
                  onClick={() => setFilter({ type: "group", id: g })}
                  aria-pressed={isActive({ type: "group", id: g })}
                  className={`flex items-center gap-2 rounded-full px-3 py-1 font-display text-lg transition-colors ${
                    isActive({ type: "group", id: g }) ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary/10"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {groupLabel(g, lang)}
                </button>
                <div className="mt-4 flex flex-wrap gap-2">
                  {categoriesByGroup(g).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      title={c.description}
                      aria-pressed={isActive({ type: "category", id: c.id })}
                      className={chip(isActive({ type: "category", id: c.id }))}
                      onClick={() => setFilter({ type: "category", id: c.id })}
                    >
                      {categoryLabel(c, lang)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-foreground">{t.count(result?.totalCount ?? 0)}</span>
          {filterLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
              {filterLabel}
              <button type="button" aria-label={t.remove} onClick={() => setFilter(null)} className="rounded-full p-0.5 hover:bg-background">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as ArticleSort)}>
          <SelectTrigger className="w-40 rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t.newest}</SelectItem>
            <SelectItem value="oldest">{t.oldest}</SelectItem>
            <SelectItem value="title">{t.byTitle}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {result && result.items.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-dashed border-border bg-card py-16 text-center text-muted-foreground">
          {t.empty}
        </p>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {result?.items.map((art) => (
            <article key={art.id} className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
              
                <div className="m-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-[color-mix(in_oklab,var(--gold)_45%,transparent)] bg-background text-muted-foreground/60">
                {art.imageUrl ? (
                  <img src={art.imageUrl} alt={art.title} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-10 w-10" />
                )}
              </div>
              <div className="flex flex-1 flex-col px-5 pb-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                    <Gem className="h-3 w-3 text-tatreez" />
                    {catName(art.categoryId)}
                  </span>
                   
                    <button
                    type="button"
                    aria-label={t.save}
                    aria-pressed={saved.includes(art.id)}
                    onClick={() => handleSave(art.id)}
                    className="text-primary"
                  >
                    <Bookmark className={`h-5 w-5 ${saved.includes(art.id) ? "fill-current" : ""}`} />
                  </button>

                </div>
                <h2 className="mt-3 font-display text-lg text-foreground">{art.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{art.summary}</p>
                <Link to="/article/$id" params={{ id: art.id }} className="mt-auto pt-4 text-sm font-semibold text-tatreez hover:underline">
                  {t.readMore}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {result && result.totalCount > 0 && (
        <nav aria-label="pagination" className="mt-10 flex items-center justify-center gap-2">
          {[
            { icon: FirstIcon, to: 1, label: "first" },
            { icon: PrevIcon, to: page - 1, label: "previous" },
          ].map(({ icon: I, to, label }) => (
            <button key={label} type="button" aria-label={label} disabled={page <= 1} onClick={() => setPage(to)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border disabled:opacity-40">
              <I className="h-4 w-4" />
            </button>
          ))}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" aria-current={n === page ? "page" : undefined} onClick={() => setPage(n)}
              className={`h-9 w-9 rounded-full border text-sm ${n === page ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
              {n}
            </button>
          ))}
          {[
            { icon: NextIcon, to: page + 1, label: "next" },
            { icon: LastIcon, to: totalPages, label: "last" },
          ].map(({ icon: I, to, label }) => (
            <button key={label} type="button" aria-label={label} disabled={page >= totalPages} onClick={() => setPage(to)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border disabled:opacity-40">
              <I className="h-4 w-4" />
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
