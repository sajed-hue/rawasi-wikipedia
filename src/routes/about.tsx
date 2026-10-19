import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Box, Download, FileCheck, Image as ImageIcon, Send, ShoppingCart, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
import { useLanguage } from "@/lib/i18n";
import { useSiteStats } from "@/lib/api/queries";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن | رواسي" },
      { name: "description", content: "تعرّف على موقع وتطبيق رواسي لحفظ التراث الفلسطيني." },
      { property: "og:title", content: "من نحن | رواسي" },
      { property: "og:description", content: "موقع رواسي وتطبيقه ثلاثي الأبعاد للتراث الفلسطيني." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

const copy = {
  ar: {
    heroTitle: "لكل قطعة حكاية...",
    heroText:
      "التراث الفلسطيني ذاكرة حيّة تنسجها خيوط التطريز، ويحفظها زيت الزيتون، وترويها حكايات الجدات. في رواسي نجمع هذه القطع لتبقى حاضرة للأجيال القادمة.",
    startExplore: "ابدأ الاستكشاف",
    appTitle: "اكتشف تطبيق رواسي",
    appText:
      "عِش تجربة متجر فلسطيني افتراضي ثلاثي الأبعاد، تتجول فيه بين القطع التراثية وتتفاعل معها وتتعرف على قصصها.",
    download: "تنزيل",
    appBtn: "صفحة التطبيق",
    soon: "قريبًا",
    servicesTitle: "ماذا نقدّم في رواسي",
    features: [
      ["قطع تراثية تفاعلية", "شاهد القطع وحركها واكتشف تفاصيلها"],
      ["متجر افتراضي", "تجول في متجر فلسطيني ثلاثي الأبعاد"],
      ["استكشاف التراث الفلسطيني", "تعرف على التطريز والفخار والأدوات"],
      ["شارك بتراثك", "أرسل قصصك وصورك للمراجعة والنشر"],
      ["حكايات وذكريات", "تصفح الصور القديمة وقصص الذاكرة الفلسطينية"],
      ["إرشاد التراث", "استكشف الحكايات والأمثال مع الجد والجدة"],
    ],
    statArticles: "مقال منشور",
    statCategories: "قسم من أقسام التراث",
    statMembers: "عضو مسجّل",
    motto: "كل حكاية تصنع غداً أكثر رسوخاً",
  },
  en: {
    heroTitle: "Every piece has a story...",
    heroText:
      "Palestinian heritage is a living memory — woven in tatreez threads, kept in olive oil, and told in our grandmothers' stories. Rawasi gathers these pieces so they stay present for generations to come.",
    startExplore: "Start exploring",
    appTitle: "Discover the Rawasi app",
    appText:
      "Step into a 3D virtual Palestinian store, wander among heritage pieces, interact with them and learn their stories.",
    download: "Download",
    appBtn: "App page",
    soon: "Coming soon",
    servicesTitle: "What Rawasi offers",
    features: [
      ["Interactive heritage pieces", "View, rotate and discover every detail"],
      ["Virtual store", "Wander a 3D Palestinian shop"],
      ["Explore Palestinian heritage", "Learn about tatreez, pottery and tools"],
      ["Share your heritage", "Send your stories and photos for review"],
      ["Stories & memories", "Browse old photos and memory stories"],
      ["Heritage guide", "Explore tales and proverbs with grandparents"],
    ],
    statArticles: "published articles",
    statCategories: "heritage categories",
    statMembers: "registered members",
    motto: "Every story builds a more rooted tomorrow",
  },
};

const featureIcons = [Box, ShoppingCart, BookOpen, Send, ImageIcon, Users];

/**
 * About page: what Rawasi is and what it offers.
 * - Intro and the app (the 3D store is not released yet).
 * - The services list.
 * - Numbers from getSiteStats(); "members" shows only when the backend provides it.
 */
function AboutPage() {
  const { lang } = useLanguage();
  const c = copy[lang];
  const { data: stats } = useSiteStats();

  const items = stats
    ? [
        { label: c.statArticles, value: stats.articles, Icon: FileCheck },
        { label: c.statCategories, value: stats.categories, Icon: BookOpen },
        ...(stats.members !== null ? [{ label: c.statMembers, value: stats.members, Icon: Users }] : []),
      ]
    : [];

  return (
    <div>
      {/* 1. Intro */}
      <section className="mx-auto max-w-4xl px-4 pt-14 text-center">
        <h1 className="text-3xl font-bold text-primary sm:text-5xl">{c.heroTitle}</h1>
        <p className="mx-auto mt-5 max-w-3xl leading-loose text-muted-foreground">{c.heroText}</p>
        <Button asChild size="lg" className="mt-8 rounded-full px-10">
          <Link to="/explore">{c.startExplore}</Link>
        </Button>
      </section>

      {/* 2. The app */}
      <section className="mx-auto max-w-4xl px-4 pt-14">
        <div className="rounded-3xl border border-[color-mix(in_oklab,var(--gold)_45%,transparent)] bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-bold text-primary">{c.appTitle}</h2>
          <p className="mt-4 leading-loose text-muted-foreground">{c.appText}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="rounded-full px-8" type="button" disabled title={c.soon}>
              <Download className="h-4 w-4" />
              {c.download}
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8" type="button" disabled title={c.soon}>
              {c.appBtn}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{c.soon}</p>
        </div>
      </section>

      {/* 3. Services */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <h2 className="text-center text-2xl font-bold text-primary sm:text-3xl">{c.servicesTitle}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {c.features.map(([title, desc], i) => {
            const Icon = featureIcons[i]!;
            return (
              <Reveal key={title} delay={i * 80} className="h-full">
              <div className="h-full rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-primary">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* 4. Numbers */}
      <section className="mt-16 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-12 lg:flex-row lg:justify-between">
          <div className="grid w-full gap-8 sm:grid-flow-col sm:auto-cols-fr lg:w-auto lg:gap-14">
            {items.map(({ label, value, Icon }, i) => (
              <Reveal key={label} delay={i * 120}>
              <div className="flex items-center justify-center gap-3">
                <Icon className="h-8 w-8 text-gold" />
                <div>
                  <div className="font-display text-3xl font-bold tabular-nums">
                    <CountUp value={value} suffix="+" />
                  </div>
                  <div className="text-sm opacity-80">{label}</div>
                </div>
              </div>
              </Reveal>
            ))}
          </div>
          <p className="font-display text-xl font-bold text-gold">{c.motto}</p>
        </div>
      </section>
    </div>
  );
}