import oliveAsset from "@/assets/olive-branch.png.asset.json";
import { useLanguage } from "@/lib/i18n";

export function PlaceholderPage({ title }: { title: string }) {
  const { t } = useLanguage();
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center">
      <img src={oliveAsset.url} alt="" className="mx-auto h-24 w-auto opacity-75" />
      <h1 className="mt-6 text-3xl font-bold text-primary sm:text-4xl">{title}</h1>
      <div className="mx-auto mt-4 h-px w-24 bg-[color-mix(in_oklab,var(--gold)_70%,transparent)]" />
      <p className="mt-4 text-muted-foreground">{t("page.soon")}</p>
    </section>
  );
}
