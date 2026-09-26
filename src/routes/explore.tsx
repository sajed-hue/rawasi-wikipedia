import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "استكشف التراث | رواسي" },
      { name: "description", content: "استكشف قصص وصور ومقتنيات التراث الفلسطيني." },
      { property: "og:title", content: "استكشف التراث | رواسي" },
      { property: "og:description", content: "استكشف مجموعات التراث الفلسطيني على رواسي." },
    ],
  }),
  component: () => <PlaceholderPage title={useLanguage().t("page.explore")} />,
});
