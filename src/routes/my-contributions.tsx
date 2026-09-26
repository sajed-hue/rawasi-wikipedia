import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/my-contributions")({
  head: () => ({
    meta: [
      { title: "مشاركتك | رواسي" },
      { name: "description", content: "تابع مساهماتك في توثيق التراث الفلسطيني." },
      { property: "og:title", content: "مشاركتك | رواسي" },
      { property: "og:description", content: "مساهماتك في منصة رواسي." },
    ],
  }),
  component: () => <PlaceholderPage title={useLanguage().t("page.contributions")} />,
});
