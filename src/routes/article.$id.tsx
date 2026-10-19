import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Bookmark, Calendar, Gem, ImageIcon, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { useLanguage } from "@/lib/i18n";
import { usePublicPost, usePostMedia, useCategoryIndex } from "@/lib/api/queries";
import { mediaContentUrl } from "@/lib/api/media";
import { isApiError } from "@/lib/api/problem";
import { Reveal } from "@/components/Reveal";

import { getSavedIds, toggleSaved } from "@/data/saved";
import { useMockAuth } from "@/lib/mock-auth";

/**
 * Article detail page, opened from "read more" links as /article/<id>.
 * Loads the approved public post + its media gallery. The backend returns 404
 * for missing OR privacy-masked posts, which we render as a single "not found".
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
    errorTitle: "تعذّر تحميل المقال",
    errorText: "حدث خطأ غير متوقع. تحقّق من اتصالك وحاول مرة أخرى.",
    retry: "إعادة المحاولة",
    save: "حفظ",
    saved: "محفوظ",
  },
  en: {
    back: "Back to Explore Heritage",
    published: "Published on",
    notFoundTitle: "We couldn't find this article",
    notFoundText: "It may not exist or may not be approved yet.",
    errorTitle: "We couldn't load this article",
    errorText: "Something went wrong. Check your connection and try again.",
    retry: "Try again",
    save: "Save",
    saved: "Saved",
  },
};

function ArticlePage() {
  const { id } = Route.useParams();
  const { lang } = useLanguage();
  const t = copy[lang];

  const postQuery = usePublicPost(id);
  const { index: catIndex } = useCategoryIndex();
  const mediaQuery = usePostMedia(id, postQuery.isSuccess);

  const [selected, setSelected] = useState(0);
  useEffect(() => setSelected(0), [id]);

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

  // No data yet (and not an error) → skeleton. Matches the server render
  // (queries are client-only), avoiding an SSR/client hydration mismatch.
  if (!postQuery.data && !postQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6" aria-busy="true">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-6 aspect-[16/10] w-full animate-pulse rounded-2xl bg-muted" />
        <div className="mt-6 h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-8 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  // Not found (404) vs. unexpected error
  if (postQuery.isError) {
    const notFound = isApiError(postQuery.error) && postQuery.error.kind === "notFound";
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl text-primary">
          {notFound ? t.notFoundTitle : t.errorTitle}
        </h1>
        <p className="mt-3 text-muted-foreground">{notFound ? t.notFoundText : t.errorText}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {!notFound && (
            <button
              type="button"
              onClick={() => void postQuery.refetch()}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <RefreshCw className="h-4 w-4" />
              {t.retry}
            </button>
          )}
          {backLink}
        </div>
      </div>
    );
  }

  const article = postQuery.data;
  if (!article) return null;

  const category = catIndex.byId.get(article.categoryId);
  const media = mediaQuery.data ?? [];
  const hero = media[selected] ?? media[0];
  const date = new Date(article.createdAt).toLocaleDateString(lang === "ar" ? "ar" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {backLink}

      <Reveal>
        {hero ? (
          <img
            src={mediaContentUrl(article.id, hero.id)}
            alt={hero.altText ?? article.title}
            className="mt-6 aspect-[16/10] w-full rounded-2xl border border-border object-cover"
          />
        ) : (
          <div className="mt-6 grid h-64 place-items-center rounded-2xl border border-border bg-secondary text-muted-foreground sm:h-80">
            <ImageIcon className="h-12 w-12" />
          </div>
        )}
      </Reveal>

      {media.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {media.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelected(i)}
              aria-pressed={i === selected}
              aria-label={m.altText ?? `Image ${i + 1}`}
              className={`h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors ${
                i === selected ? "border-primary" : "border-transparent hover:border-border"
              }`}
            >
              <img
                src={mediaContentUrl(article.id, m.id)}
                alt={m.altText ?? ""}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
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
            {lang === "en" ? category.nameEn : category.name}
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

      <Reveal>
        <h1 className="mt-4 font-display text-3xl text-primary sm:text-4xl">{article.title}</h1>

        <div className="mt-6 space-y-4 leading-8 text-foreground">
          {article.content.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </Reveal>
    </article>
  );
}
