import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, Search } from "lucide-react";

import heroAsset from "@/assets/hero-dallah.webp.asset.json";
import cardOliveAsset from "@/assets/card-olive-harvest.webp.asset.json";
import cardPotteryAsset from "@/assets/card-pottery.webp.asset.json";
import cardTatreezAsset from "@/assets/card-tatreez.webp.asset.json";
import bannerAsset from "@/assets/banner-olive-press.webp.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";

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
    heroTitleAccent: "وانت جزء منها",
    heroLead:
      "منصة تشاركية لحفظ التراث الفلسطيني وتوثيقه، من الحكايات والتطريز إلى الأكلات والأمثال. شاركنا حكايتك وساعدنا في نقلها للأجيال القادمة.",
    searchPlaceholder: "ابحث في التراث...",
    searchButton: "بحث",
    addContribution: "أضف مشاركتك",
    explore: "استكشف التراث",
    landLabel: "من الأرض... نروي الحكاية",
    storiesHeading: "حكايات من تراثنا",
    heroAlt: "دلة نحاسية في نافذة حجرية على مفارش مطرزة",
    cards: [
      {
        img: cardOliveAsset.url,
        alt: "يدان تقطفان الزيتون في سلة من الخوص",
        pill: "مواسم",
        title: "موسم قطف الزيتون",
        subtitle: "حكاية الأرض والعائلة",
      },
      {
        img: cardPotteryAsset.url,
        alt: "فخّار يشكّل جرّة على عجلة الفخار",
        pill: "حِرَف",
        title: "الفخار الفلسطيني",
        subtitle: "حرفة تتناقلها الأجيال",
      },
      {
        img: cardTatreezAsset.url,
        alt: "ثوب فلسطيني مطرّز بخيوط حمراء",
        pill: "تطريز",
        title: "التطريز الفلسطيني",
        subtitle: "خيوط تروي حكايات الهوية والانتماء",
      },
    ],
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
    addContribution: "Add your contribution",
    explore: "Explore Heritage",
    landLabel: "From the land... we tell the story",
    storiesHeading: "Stories from our heritage",
    heroAlt: "Brass coffee pot in a stone window on embroidered cloth",
    cards: [
      {
        img: cardOliveAsset.url,
        alt: "Hands picking olives into a woven basket",
        pill: "Seasons",
        title: "Olive Harvest Season",
        subtitle: "A story of land and family",
      },
      {
        img: cardPotteryAsset.url,
        alt: "Potter shaping a jar on a spinning wheel",
        pill: "Crafts",
        title: "Palestinian Pottery",
        subtitle: "A craft passed down through generations",
      },
      {
        img: cardTatreezAsset.url,
        alt: "Palestinian dress embroidered in red threads",
        pill: "Tatreez",
        title: "Palestinian Tatreez",
        subtitle: "Threads that tell stories of identity and belonging",
      },
    ],
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

function Index() {
  const { lang, dir } = useLanguage();
  const c = copy[lang];

  return (
    <>
      {/* Section 1 — Hero */}
      <section className="relative overflow-hidden">
        <div className="tatreez-bg pointer-events-none absolute -top-6 start-0 h-40 w-40 opacity-40" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div className="relative">
            <div className="overflow-hidden rounded-t-[12rem] rounded-b-3xl border border-[color-mix(in_oklab,var(--gold)_60%,transparent)] bg-card shadow-[var(--shadow-soft)]">
              <img
                src={heroAsset.url}
                alt={c.heroAlt}
                className="h-105 w-full object-cover"
              />
            </div>
            <div className="tatreez-bg mx-auto mt-4 h-5 w-2/3 rounded-full opacity-60" />
          </div>

          <div className="text-center lg:text-start">
            <h1 className="text-3xl font-bold leading-tight text-primary sm:text-4xl lg:text-5xl">
              {c.heroTitle}{" "}
              <span className="text-tatreez">{c.heroTitleAccent}</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground lg:mx-0 sm:text-lg">
              {c.heroLead}
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="mx-auto mt-7 flex max-w-md gap-2 lg:mx-0"
            >
              <Input
                type="search"
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

      {/* Section 2 — Stories from our heritage */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" dir={dir}>
          {c.cards.map((card) => (
            <article
              key={card.title}
              className="group rounded-3xl bg-card p-3 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-soft)]"
            >
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={card.img}
                  alt={card.alt}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 right-3 rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary shadow-[var(--shadow-card)]">
                  {card.pill}
                </span>
              </div>
              <div className="px-2 pb-3 pt-4">
                <h3 className="text-lg font-bold text-primary">{card.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {card.subtitle}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-xl font-bold text-primary sm:text-2xl">{c.callout}</p>
          <p className="mt-2 text-xs text-muted-foreground">{c.calloutNote}</p>
          <Link
            to="/my-contributions"
            className="mt-5 inline-block rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-opacity hover:opacity-90"
          >
            {c.calloutButton}
          </Link>
        </div>
      </section>

      {/* Section 3 — Interactive store banner */}
      <section className="mx-auto max-w-7xl px-4 pb-4">
        <div className="relative overflow-hidden rounded-3xl shadow-[var(--shadow-soft)]">
          <img
            src={bannerAsset.url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden
          />
          <div className="absolute inset-0 bg-primary/75" />

          <div className="relative flex flex-col items-center gap-4 px-6 py-16 text-center sm:py-20">
            <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
              {c.bannerTitle}
            </h2>
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
