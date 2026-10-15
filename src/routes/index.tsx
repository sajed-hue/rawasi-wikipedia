import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Box, ImageIcon, Search } from "lucide-react";
import { useEffect, useState, type SyntheticEvent } from "react";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getArticles, type Article, type PagedResult } from "@/data/articles";
import { categories, categoryLabel} from "@/data/categories";
import { useLanguage } from "@/lib/i18n";
import InMain from "@/assets/InMain.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "رواسي | Rawasi — منصة التراث الفلسطيني" },
      {
        name: "description",
        content:
          "منصة تشاركية لحفظ التراث الفلسطيني: الحكايات، التطريز، الأكلات والأمثال.",
      },
      { property: "og:title", content: "رواسي | Rawasi" },
      {
        property: "og:description",
        content: "منصة تشاركية لحفظ التراث الفلسطيني وتوثيقه.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const copy = {
  ar: {
    heroTitle: "تراثنا حكاية...",
    heroTitleAccent: "وأنت جزء منها",
    heroLead:
      "منصة تشاركية لحفظ التراث الفلسطيني وتوثيقه، من الحكايات والتطريز إلى الأكلات والأمثال. شاركنا حكايتك وساعدنا في نقلها للأجيال القادمة.",
    searchPlaceholder: "ابحث في التراث...",
    searchButton: "بحث",
    explore: "استكشف التراث",
    landLabel: "من الأرض... نروي الحكاية",
    storiesHeading: "حكايات من تراثنا",
    InMain: "دلة نحاسية في نافذة حجرية على مفارش مطرزة",
    latestEmpty: "لا توجد مقالات منشورة بعد. كن أول من يشارك!",
    readMore: "اقرأ المزيد",
    statArticles: "مقال منشور",
    statCategories: "قسم من أقسام التراث",
    callout: "لكل بيت حكاية تستحق أن تُروى",
    calloutNote: "(سوف تُراجع من قبل المسؤول قبل النشر)",
    calloutButton: "+ أضف مشاركتك",
    bannerTitle: "عِش التراث بتجربة تفاعلية",
    bannerLead: "تجوّل في متجر رواسي واستكشف القطع ثلاثية الأبعاد",
    bannerButton: "ادخل المتجر الافتراضي",
  },
  en: {
    heroTitle: "Our heritage is a story...",
    heroTitleAccent: "and you are part of it",
    heroLead:
      "A community platform to preserve and document Palestinian heritage — from stories and tatreez to food and proverbs. Share your story and help carry it to the next generation.",
    searchPlaceholder: "Search our heritage...",
    searchButton: "Search",
    explore: "Explore Heritage",
    landLabel: "From the land... we tell the story",
    storiesHeading: "Stories from our heritage",
    InMain: "Brass coffee pot in a stone window on embroidered cloth",
    latestEmpty: "No published articles yet. Be the first to share!",
    readMore: "Read more",
    statArticles: "published articles",
    statCategories: "heritage categories",
    callout: "Every home has a story worth telling",
    calloutNote: "(Reviewed by an admin before publishing)",
    calloutButton: "+ Add your contribution",
    bannerTitle: "Experience heritage interactively",
    bannerLead: "Walk through the Rawasi store and explore 3D pieces",
    bannerButton: "Enter the virtual store",
  },
} as const;

function Diamond() {
  return <span className="h-1.5 w-1.5 rotate-45 rounded-[1px] bg-gold" aria-hidden />;
}

/**
 * Home page.
 * - The search box sends the visitor to Explore with their words typed in.
 * - "Stories from our heritage" shows the 3 newest approved articles.
 * - The counts strip shows real numbers from the data.
 */
function Index() {
  const { lang, dir } = useLanguage();
  const c = copy[lang];
  const navigate = useNavigate();

  const [text, setText] = useState("");
  const [latest, setLatest] = useState<PagedResult<Article> | null>(null);

  // Load the 3 newest approved articles (and the total count) once.
  useEffect(() => {
    let alive = true;
    getArticles({ sort: "newest", page: 1, pageSize: 3 }).then((r) => alive && setLatest(r));
    return () => {
      alive = false;
    };
  }, []);

  /** handleSearch: opens Explore with the typed words as the search. */
  function handleSearch(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = text.trim();
    navigate({ to: "/explore", search: q ? { q } : {} });
  }

  return (
    <>
      {/* Section 1 — Hero */}
      <section className="relative overflow-hidden">
        <div className="tatreez-bg pointer-events-none absolute -top-6 start-0 h-40 w-40 opacity-40" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div className="relative">
            <div className="overflow-hidden rounded-t-[12rem] rounded-b-3xl border border-[color-mix(in_oklab,var(--gold)_60%,transparent)] bg-card shadow-[var(--shadow-soft)]">
              <img src={InMain} alt={c.InMain} className="h-105 w-full object-cover" />
            </div>
            <div className="tatreez-bg mx-auto mt-4 h-5 w-2/3 rounded-full opacity-60" />
          </div>

          <div className="text-center lg:text-start">
            <h1 className="text-3xl font-bold leading-tight text-primary sm:text-4xl lg:text-5xl">
              {c.heroTitle} <span className="text-tatreez">{c.heroTitleAccent}</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground lg:mx-0 sm:text-lg">
              {c.heroLead}
            </p>

            <form onSubmit={handleSearch} className="mx-auto mt-7 flex max-w-md gap-2 lg:mx-0">
              <Input
                type="search"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={c.searchPlaceholder}
                className="rounded-full bg-card"
                aria-label={c.searchButton}
              />
              <Button
                type="submit"
                className="shrink-0 rounded-full px-6 shadow-[var(--shadow-card)] transition-opacity hover:opacity-90"
              >
                <Search className="h-4 w-4" />
                {c.searchButton}
              </Button>
            </form>

            <div className="mt-6 flex justify-center lg:justify-start">
              <Link
                to="/explore"
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-opacity hover:opacity-90"
              >
                {c.explore}
              </Link>
            </div>

            <p className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground lg:justify-start">
              <Diamond />
              {c.landLabel}
              <Diamond />
            </p>

            <h2 className="mt-10 inline-block border-b-2 border-[color-mix(in_oklab,var(--gold)_65%,transparent)] pb-2 text-2xl font-bold text-primary sm:text-3xl">
              {c.storiesHeading}
            </h2>
          </div>
        </div>
      </section>

      {/* Section 2 — Latest real articles */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        {latest && latest.items.length === 0 && (
          <p className="rounded-3xl border border-dashed border-border bg-card py-12 text-center text-muted-foreground">
            {c.latestEmpty}
          </p>
        )}

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" dir={dir}>
          {latest?.items.map((a) => {
            const category = categories.find((cat) => cat.id === a.categoryId);
            return (
              <Link
                key={a.id}
                to="/article/$id"
                params={{ id: a.id }}
                className="group block rounded-3xl bg-card p-3 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-soft)]"
              >
                <div className="relative overflow-hidden rounded-2xl">
                  {a.imageUrl ? (
                    <img
                      src={a.imageUrl}
                      alt={a.title}
                      className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid aspect-[4/3] w-full place-items-center bg-secondary text-muted-foreground/60">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                  {category && (
                    <span className="absolute top-3 right-3 rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary shadow-[var(--shadow-card)]">
                      {categoryLabel(category, lang)}
                    </span>
                  )}
                </div>
                <div className="px-2 pb-3 pt-4">
                  <h3 className="text-lg font-bold text-primary">{a.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{a.summary}</p>
                  <span className="mt-3 inline-block text-sm font-semibold text-tatreez group-hover:underline">
                    {c.readMore}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-xl font-bold text-primary sm:text-2xl">{c.callout}</p>
          <p className="mt-2 text-xs text-muted-foreground">{c.calloutNote}</p>
          <Link
            to="/contribute"
            className="mt-5 inline-block rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-opacity hover:opacity-90"
          >
            {c.calloutButton}
          </Link>
        </div>
      </section>


      {/* Section 4 — Interactive store banner */}
      {/* Section 4 — Interactive store banner */}
      <section className="mx-auto max-w-7xl px-4 pb-4">
       <div className="relative overflow-hidden rounded-3xl bg-primary shadow-[var(--shadow-soft)]">
        {/* placeholder: swap for a real image later */}
       <div
         className="tatreez-bg absolute inset-0 opacity-30"
         aria-hidden
         />
        <div
         className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[color-mix(in_oklab,var(--primary)_70%,black)]"
          aria-hidden
        />

    <div className="relative flex flex-col items-center gap-4 px-6 py-16 text-center sm:py-20">
            <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">{c.bannerTitle}</h2>
            <p className="max-w-xl text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
              {c.bannerLead}
            </p>
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-semibold text-foreground shadow-[var(--shadow-soft)] transition-opacity hover:opacity-90"
            >
              <Box className="h-4 w-4" />
              {c.bannerButton}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}