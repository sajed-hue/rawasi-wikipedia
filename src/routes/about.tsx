import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Box,
  Clock,
  Download,
  FileCheck,
  Image as ImageIcon,
  MessageCircle,
  Send,
  ShoppingCart,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن | رواسي" },
      { name: "description", content: "تعرّف على موقع وتطبيق رواسي لحفظ التراث الفلسطيني." },
      { property: "og:title", content: "من نحن | رواسي" },
      { property: "og:description", content: "موقع رواسي وتطبيقه ثلاثي الأبعاد للتراث الفلسطيني." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const copy = {
  ar: {
    heroTitle: "لكل قطعة حكاية...",
    heroText:
      "التراث الفلسطيني ذاكرة حيّة تنسجها خيوط التطريز، ويحفظها زيت الزيتون، وترويها حكايات الجدات. في رواسي نجمع هذه القطع لتبقى حاضرة للأجيال القادمة.",
    startExplore: "ابدأ بالأستكشاف ...",
    game: "لعبة رواسي",
    web: "موقع الويب",
    webTitle: "اكتشف ما يقدمه موقع رواسي",
    webText:
      "استكشف التراث الفلسطيني عبر المقالات والصور والحكايات، وشارك بمحتواك الخاص من قصص وصور ليصبح جزءاً من ذاكرتنا المشتركة.",
    webBtn: "انتقل إلى الصفحة الرئيسية للموقع",
    appTitle: "اكتشف ما يقدمه تطبيق رواسي",
    appText:
      "عِش تجربة متجر فلسطيني افتراضي ثلاثي الأبعاد، تتجول فيه بين القطع التراثية وتتفاعل معها وتتعرف على قصصها.",
    download: "تنزيل",
    appBtn: "انتقل إلى صفحة التطبيق",
    features: [
      ["قطع تراثية تفاعلية", "شاهد القطع وحركها واكتشف تفاصيلها"],
      ["متجر افتراضي", "تجول في متجر فلسطيني ثلاثي الأبعاد"],
      ["استكشاف التراث الفلسطيني", "تعرف على التطريز والفخار والأدوات"],
      ["شارك بتراثك", "أرسل قصصك وصورك للمراجعة والنشر"],
      ["حكايات وذكريات", "تصفح الصور القديمة وقصص الذاكرة الفلسطينية"],
      ["إرشاد التراث", "استكشف الحكايات والأمثال مع الجد والجدة"],
    ],
    stats: ["المساهمات المنشورة", "اجمالي المساهمات", "زوار المنصة"],
    motto: "كل حكاية تصنع غداً أكثر رسوخاً",
  },
  en: {
    heroTitle: "Every piece has a story...",
    heroText:
      "Palestinian heritage is a living memory — woven in tatreez threads, kept in olive oil, and told in our grandmothers' stories. Rawasi gathers these pieces so they stay present for generations to come.",
    startExplore: "Start exploring ...",
    game: "Rawasi Game",
    web: "Website",
    webTitle: "Discover the Rawasi website",
    webText:
      "Explore Palestinian heritage through articles, photos and stories, and contribute your own stories and photos to our shared memory.",
    webBtn: "Go to the website home page",
    appTitle: "Discover the Rawasi app",
    appText:
      "Step into a 3D virtual Palestinian store, wander among heritage pieces, interact with them and learn their stories.",
    download: "Download",
    appBtn: "Go to the app page",
    features: [
      ["Interactive heritage pieces", "View, rotate and discover every detail"],
      ["Virtual store", "Wander a 3D Palestinian shop"],
      ["Explore Palestinian heritage", "Learn about tatreez, pottery and tools"],
      ["Share your heritage", "Send your stories and photos for review"],
      ["Stories & memories", "Browse old photos and memory stories"],
      ["Heritage guide", "Explore tales and proverbs with grandparents"],
    ],
    stats: ["Published contributions", "Total contributions", "Platform visitors"],
    motto: "Every story builds a more rooted tomorrow",
  },
};

const featureIcons = [Box, ShoppingCart, BookOpen, Send, ImageIcon, Users];
const statIcons = [FileCheck, Clock, Users];
const statValues = ["115", "150", "+99"];

function Photo({ className = "" }: { className?: string }) {
  return (
    <div
      className={`grid aspect-[4/3] w-full place-items-center rounded-3xl border border-[color-mix(in_oklab,var(--gold)_45%,transparent)] bg-card text-muted-foreground/60 shadow-[var(--shadow-card)] ${className}`}
    >
      <ImageIcon className="h-10 w-10" />
    </div>
  );
}

function AboutPage() {
  const { lang } = useLanguage();
  const c = copy[lang];

  return (
    <div>
      {/* 1. Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-14 text-center">
        <h1 className="text-3xl font-bold text-primary sm:text-5xl">{c.heroTitle}</h1>
        <p className="mx-auto mt-5 max-w-3xl leading-loose text-muted-foreground">{c.heroText}</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="relative">
            <Photo src={pottery} />
            <span className="absolute bottom-3 left-3 grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-[color-mix(in_oklab,var(--gold)_60%,transparent)]">
              <MessageCircle className="h-5 w-5" />
            </span>
          </div>
          <Photo src={coffee} />
          <Photo src={tatreez} />
        </div>
      </section>

      {/* 2. Second row + hub buttons */}
      <section className="mx-auto max-w-6xl px-4 pt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Photo src={olive} />
          <div className="relative">
            <Photo src={oldcity} />
            <Link
              to="/explore"
              className="absolute inset-x-0 top-1/2 mx-auto w-fit -translate-y-1/2 rounded-full bg-background/95 px-6 py-3 text-sm font-bold text-primary shadow-[var(--shadow-soft)]"
            >
              {c.startExplore}
            </Link>
          </div>
          <Photo src={oil} />
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button variant="outline" size="lg" className="rounded-full px-10" asChild>
            <a href="#app">{c.game}</a>
          </Button>
          <Button size="lg" className="rounded-full px-10" asChild>
            <a href="#web">{c.web}</a>
          </Button>
        </div>
      </section>

      {/* 3. Intro blocks */}
      <section className="mx-auto max-w-4xl space-y-6 px-4 pt-16">
        <div id="web" className="rounded-3xl border border-[color-mix(in_oklab,var(--gold)_45%,transparent)] bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-bold text-primary">{c.webTitle}</h2>
          <p className="mt-4 leading-loose text-muted-foreground">{c.webText}</p>
          <Button size="lg" className="mt-6 rounded-full px-8" asChild>
            <Link to="/">{c.webBtn}</Link>
          </Button>
        </div>
        <div id="app" className="rounded-3xl border border-[color-mix(in_oklab,var(--gold)_45%,transparent)] bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-bold text-primary">{c.appTitle}</h2>
          <p className="mt-4 leading-loose text-muted-foreground">{c.appText}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="rounded-full px-8" type="button">
              <Download className="h-4 w-4" />
              {c.download}
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8" type="button">
              {c.appBtn}
            </Button>
          </div>
        </div>
      </section>

      {/* 4. Features */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {c.features.map(([title, desc], i) => {
            const Icon = featureIcons[i]!;
            return (
              <div key={title} className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-primary">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Stats band */}
      <section className="mt-16 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-12 lg:flex-row lg:justify-between">
          <div className="grid w-full gap-8 sm:grid-cols-3 lg:w-auto lg:gap-14">
            {c.stats.map((label, i) => {
              const Icon = statIcons[i]!;
              return (
                <div key={label} className="flex items-center justify-center gap-3">
                  <Icon className="h-8 w-8 text-gold" />
                  <div>
                    <div className="font-display text-3xl font-bold">{statValues[i]}</div>
                    <div className="text-sm opacity-80">{label}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="font-display text-xl font-bold text-gold">{c.motto}</p>
        </div>
      </section>
    </div>
  );
}
