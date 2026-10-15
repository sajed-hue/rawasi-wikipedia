import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Bookmark, Calendar, Gem, ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { getArticleById, type Article } from "@/data/articles";
import { categories, categoryLabel } from "@/data/categories";
import { useLanguage } from "@/lib/i18n";

import { getSavedIds, toggleSaved } from "@/data/saved";
import { useMockAuth } from "@/lib/mock-auth";

/**
 * Article detail page, opened from "read more" links as /article/<id>.
 * - The id comes from the web address.
 * - Loads that article with getArticleById().
 * - Shows loading, not-found, or the full article.
 * Header and footer come from __root.tsx, so they are not added here.
 */
export const Route = createFileRoute("/article/$id")({
  component: ArticlePage,
});

const copy = {
  ar: {
    back: "العودة إلى استكشف التراث",
    published: "نُشر في",
    notFoundTitle: "لم نجد هذا المقال",
    notFoundText: "قد يكون المقال غير موجود أو لم تتم الموافقة عليه بعد.",
    loading: "جارٍ التحميل...",
    save: "حفظ", saved: "محفوظ",
  },
  en: {
    back: "Back to Explore Heritage",
    published: "Published on",
    notFoundTitle: "We couldn't find this article",
    notFoundText: "It may not exist or may not be approved yet.",
    loading: "Loading...",
    save: "Save", saved: "Saved",
  },
};

function ArticlePage() {
  const { id } = Route.useParams();
  const { lang } = useLanguage();
  const t = copy[lang];

  // undefined = still loading, null = not found, Article = found
  const [article, setArticle] = useState<Article | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    setArticle(undefined);
    getArticleById(id).then((a) => alive && setArticle(a));
    return () => {
      alive = false;
    };
  }, [id]);

  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;
  const backLink = (
    <Link
      to="/explore"
      className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
    >
      <BackIcon className="h-4 w-4" />
      {t.back}
    </Link>
  );

  const { isLoggedIn } = useMockAuth();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => setIsSaved(getSavedIds().includes(id)), [id]);

  /** handleSave: saves or unsaves this article. Guests are sent to log in first. */
  function handleSave() {
    if (!isLoggedIn) {
      navigate({ to: "/login" });
      return;
    }
    setIsSaved(toggleSaved(id).includes(id));
  }

  if (article === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        {t.loading}
      </div>
    );
  }

  if (article === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl text-primary">{t.notFoundTitle}</h1>
        <p className="mt-3 text-muted-foreground">{t.notFoundText}</p>
        <div className="mt-6">{backLink}</div>
      </div>
    );
  }

  const category = categories.find((c) => c.id === article.categoryId);
  const date = new Date(article.createdAt).toLocaleDateString(lang === "ar" ? "ar" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {backLink}

        {article.imageUrl ? (
        <img
          src={article.imageUrl}
          alt={article.title}
          className="mt-6 aspect-[16/10] w-full rounded-2xl border border-border object-cover"
        />
      ) : (
        <div className="mt-6 grid h-64 place-items-center rounded-2xl border border-border bg-secondary text-muted-foreground sm:h-80">
          <ImageIcon className="h-12 w-12" />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {category && (
          <Link
            to="/explore"
            search={{ category: category.id }}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-secondary-foreground hover:underline"
          >
            <Gem className="h-3 w-3 text-tatreez" />
            {categoryLabel(category, lang)}
          </Link>
        )}
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {t.published} {date}
        </span>

          <button
          type="button"
          onClick={handleSave}
          aria-pressed={isSaved}
          className="ms-auto inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm text-primary hover:bg-secondary"
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
          {isSaved ? t.saved : t.save}
        </button>
      </div>

      <h1 className="mt-4 font-display text-3xl text-primary sm:text-4xl">{article.title}</h1>

      <div className="mt-6 space-y-4 leading-8 text-foreground">
        {article.content.split("\n\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}