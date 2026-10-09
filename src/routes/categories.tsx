import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  ChefHat,
  Coffee,
  Hammer,
  Landmark,
  Music2,
  Shirt,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

import {
  CATEGORY_GROUP_LABELS,
  categoriesByGroup,
  type Category,
  type CategoryGroup,
} from "@/data/categories";
import { useLanguage, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "أقسام التراث | رواسي" },
      {
        name: "description",
        content:
          "ثماني تصنيفات للتراث الفلسطيني على منصة رواسي، مقسومة إلى التراث المادي والتراث غير المادي.",
      },
      { property: "og:title", content: "أقسام التراث | رواسي" },
      {
        property: "og:description",
        content:
          "تصفح تصنيفات رواسي: العمارة والآثار، المقتنيات، الأزياء والحلي، الفنون الشعبية، الأدب الشفوي، العادات، الحرف، والمطبخ الفلسطيني.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Categories,
});

const copy = {
  ar: {
    lead: "ثماني مجموعات تروي التراث الفلسطيني: ما يُلمس من حجارةٍ وأدواتٍ وثياب، وما يُروى من حكاياتٍ وأغانٍ ومهارات.",
    groupLabel: (group: CategoryGroup) => CATEGORY_GROUP_LABELS[group],
    count: (n: number) => `${n} تصنيفات`,
  },
  en: {
    lead: "Eight groups tell the story of Palestinian heritage: what is touched in stone, tools and cloth, and what is told in stories, songs and skills.",
    groupLabel: (group: CategoryGroup) =>
      group === "material" ? "Tangible Heritage" : "Intangible Heritage",
    count: (n: number) => `${n} categories`,
  },
} as const;

/** English presentation text only — the Arabic data stays the source of truth. */
const enText: Record<string, { name: string; description: string }> = {
  "mat-1": {
    name: "Architecture & Antiquities",
    description:
      "Historic palaces, mosques and churches, old houses in ancient towns, castles and city walls.",
  },
  "mat-2": {
    name: "Collections & Everyday Objects",
    description: "Pottery, copperware, and remnants of old farming tools.",
  },
  "mat-3": {
    name: "Dress & Jewelry",
    description:
      "The embroidered Palestinian thob, the kufiya, and traditional silver and gold jewelry.",
  },
  "imm-1": {
    name: "Folk Arts",
    description:
      "Palestinian dabke, songs of joy and hurras, popular zajal, and playing traditional instruments.",
  },
  "imm-2": {
    name: "Oral Literature & Storytelling",
    description: "Folk tales, popular proverbs, and riddles (al-tanqir).",
  },
  "imm-3": {
    name: "Social Customs & Traditions",
    description:
      "Mourning and celebration rites, the jahfa and tribal reconciliation (sulha), and awna work seasons.",
  },
  "imm-4": {
    name: "Traditional Skills & Crafts",
    description:
      "Nablusi soap making, olive-wood carving, glass and ceramics, carpet weaving and textiles.",
  },
  "imm-5": {
    name: "Traditional Palestinian Kitchen",
    description: "Musakhan, maqlubeh, maftoul, Nablusi kunafa, and Hebron qudra.",
  },
};

const categoryIcons: Record<string, ComponentType<{ className?: string }>> = {
  "mat-1": Landmark,
  "mat-2": Coffee,
  "mat-3": Shirt,
  "imm-1": Music2,
  "imm-2": BookOpen,
  "imm-3": Users,
  "imm-4": Hammer,
  "imm-5": ChefHat,
};

const GROUP_ORDER: CategoryGroup[] = ["material", "immaterial"];

function CategoryCard({ category, lang }: { category: Category; lang: Lang }) {
  const Icon = categoryIcons[category.id] ?? Landmark;
  const text = lang === "ar" ? category : (enText[category.id] ?? category);

  return (
    <article className="relative overflow-hidden rounded-3xl bg-card p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-soft)]">
      <span
        className="tatreez-bg absolute bottom-0 end-0 h-16 w-16 opacity-25"
        aria-hidden
      />
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="relative mt-4 text-lg font-bold text-primary">{text.name}</h3>
      <div className="relative mt-3 h-px w-10 bg-[color-mix(in_oklab,var(--gold)_60%,transparent)]" />
      <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">
        {text.description}
      </p>
    </article>
  );
}

function Categories() {
  const { lang, dir, t } = useLanguage();
  const c = copy[lang];

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="tatreez-bg pointer-events-none absolute -top-4 end-0 h-32 w-32 opacity-30" />
        <div className="mx-auto max-w-3xl px-4 pb-8 pt-14 text-center">
          <h1 className="text-3xl font-bold text-primary sm:text-4xl">
            {t("page.categories")}
          </h1>
          <div className="mx-auto mt-4 h-px w-24 bg-[color-mix(in_oklab,var(--gold)_70%,transparent)]" />
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {c.lead}
          </p>
        </div>
      </section>

      {GROUP_ORDER.map((group) => {
        const list = categoriesByGroup(group);
        return (
          <section key={group} className="mx-auto max-w-7xl px-4 pb-14">
            <header className="flex flex-wrap items-center gap-3 border-b border-[color-mix(in_oklab,var(--gold)_45%,transparent)] pb-3">
              <h2 className="text-xl font-bold text-primary sm:text-2xl">
                {c.groupLabel(group)}
              </h2>
              <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary shadow-[var(--shadow-card)]">
                {c.count(list.length)}
              </span>
            </header>

            <div
              className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              dir={dir}
            >
              {list.map((category) => (
                <CategoryCard key={category.id} category={category} lang={lang} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
