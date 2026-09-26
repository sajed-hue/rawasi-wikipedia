import { createFileRoute, Link } from "@tanstack/react-router";

import logoAsset from "@/assets/logo.png.asset.json";
import oliveAsset from "@/assets/olive-branch.png.asset.json";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "رواسي | Rawasi — منصة التراث الفلسطيني" },
      {
        name: "description",
        content: "منصة تشاركية لحفظ التراث الفلسطيني: الحكايات، التطريز، الأكلات والأمثال.",
      },
      { property: "og:title", content: "رواسي | Rawasi" },
      {
        property: "og:description",
        content: "منصة تشاركية لحفظ التراث الفلسطيني وتوثيقه.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden">
      <div className="tatreez-bg pointer-events-none absolute -top-6 start-0 h-40 w-40 opacity-40" />
      <img
        src={oliveAsset.url}
        alt=""
        className="pointer-events-none absolute -bottom-10 end-0 h-64 w-auto opacity-25"
      />

      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:py-32">
        <span className="inline-block rounded-full border border-[color-mix(in_oklab,var(--gold)_65%,transparent)] bg-card px-4 py-1.5 text-xs font-semibold text-primary">
          {t("home.badge")}
        </span>

        <img src={logoAsset.url} alt="Rawasi" className="mx-auto mt-8 h-28 w-auto sm:h-36" />

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t("home.lead")}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/explore"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-opacity hover:opacity-90"
          >
            {t("home.cta")}
          </Link>
          <Link
            to="/my-contributions"
            className="rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
          >
            {t("home.cta2")}
          </Link>
        </div>
      </div>
    </section>
  );
}
