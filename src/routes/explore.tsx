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
  RefreshCw,
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
import { categoryLabel, groupLabel } from "@/data/categories";
import { Reveal } from "@/components/Reveal";
import { usePublicPosts, useCategoryIndex } from "@/lib/api/queries";
import type { PostSort } from "@/lib/api/types";
import { useLanguage } from "@/lib/i18n";

const PAGE_SIZE = 9;

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
    error: "تعذّر تحميل المقالات. تحقّق من اتصالك وحاول مرة أخرى.",
    retry: "إعادة المحاولة",
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
    error: "We couldn't load the articles. Check your connection and try again.",
    retry: "Try again",
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
  const [categoryId, setCategoryId] = useState<string | null>(category ?? null);
  const [sort, setSort] = useState<PostSort>("newest");
  const [page, setPage] = useState(1);

  const [saved, setSaved] = useState<string[]>([]);
  const { isLoggedIn } = useMockAuth();
  const navigate = useNavigate();

  const { index: catIndex } = useCategoryIndex();
  const postsQuery = usePublicPosts({
    search: search.trim() || undefined,
    categoryId: categoryId ?? undefined,
    sort,
    page,
    pageSize: PAGE_SIZE,
  });
  const result = postsQuery.data;

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

  // Keep the active category in sync when arriving from a category link.
  useEffect(() => {
    setCategoryId(category ?? null);
  }, [category]);

  // Debounce the search box (300ms) before it hits the API.
  useEffect(() => {
    const id = setTimeout(() => setSearch(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  // Any filter/search/sort change resets to the first page.
  useEffect(() => setPage(1), [search, categoryId, sort]);

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition-colors ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-background text-foreground hover:border-primary hover:text-primary"
    }`;
  const filterLabel = categoryId ? catIndex.name(categoryId, lang) : null;
  const catName = (id: string) => catIndex.name(id, lang);
  const PrevIcon = lang === "ar" ? ChevronRight : ChevronLeft;
  const NextIcon = lang === "ar" ? ChevronLeft : ChevronRight;
  const FirstIcon = lang === "ar" ? ChevronsRight : ChevronsLeft;
  const LastIcon = lang === "ar" ? ChevronsLeft : ChevronsRight;
  const totalPages = result?.totalPages ?? 1;
  // No data yet (and not an error) → skeleton. This matches the server render
  // (queries are client-only), avoiding an SSR/client hydration mismatch.
  const isInitialLoading = !result && !postsQuery.isError;
  const isRefreshing = postsQuery.isFetching && postsQuery.isPlaceholderData;

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
          <button type="button" className={chip(categoryId === null)} onClick={() => setCategoryId(null)}>
            {t.all}
          </button>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {(["material", "immaterial"] as const).map((g, gi) => {
            const Icon = groupIcon[g];
            return (
              <Reveal key={g} delay={gi * 90}>
              <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-2 px-3 py-1 font-display text-lg text-primary">
                  <Icon className="h-5 w-5" />
                  {groupLabel(g, lang)}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {catIndex.groups[g].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      title={c.description}
                      aria-pressed={categoryId === c.id}
                      className={chip(categoryId === c.id)}
                      onClick={() => setCategoryId(c.id)}
                    >
                      {categoryLabel(c, lang)}
                    </button>
                  ))}
                </div>
              </div>
              </Reveal>
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
              <button type="button" aria-label={t.remove} onClick={() => setCategoryId(null)} className="rounded-full p-0.5 hover:bg-background">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as PostSort)}>
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

      {isInitialLoading ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: PAGE_SIZE }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
              <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-muted" />
              <div className="space-y-3 px-2 pb-3 pt-4">
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : postsQuery.isError ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border bg-card py-16 text-center">
          <p className="text-muted-foreground">{t.error}</p>
          <button
            type="button"
            onClick={() => void postsQuery.refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            {t.retry}
          </button>
        </div>
      ) : result && result.items.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-dashed border-border bg-card py-16 text-center text-muted-foreground">
          {t.empty}
        </p>
      ) : (
        <div className={`mt-6 grid gap-6 transition-opacity md:grid-cols-2 lg:grid-cols-3 ${isRefreshing ? "opacity-60" : ""}`}>
          {result?.items.map((art, i) => (
            <Reveal key={art.id} delay={i * 70} className="h-full">
            <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="m-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-[color-mix(in_oklab,var(--gold)_45%,transparent)] bg-background text-muted-foreground/60">
                <ImageIcon className="h-10 w-10" />
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
            </Reveal>
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
