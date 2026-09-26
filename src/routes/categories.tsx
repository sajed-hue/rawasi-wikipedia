import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "أقسام التراث | رواسي" },
      { name: "description", content: "تصفح أقسام التراث الفلسطيني على منصة رواسي." },
      { property: "og:title", content: "أقسام التراث | رواسي" },
      { property: "og:description", content: "تصنيفات التراث الفلسطيني: تطريز، أكلات، حكايات." },
    ],
  }),
  component: () => <PlaceholderPage title={useLanguage().t("page.categories")} />,
});
