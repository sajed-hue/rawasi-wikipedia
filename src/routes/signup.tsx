import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب | رواسي" },
      { name: "description", content: "أنشئ حسابك وشارك في توثيق التراث الفلسطيني." },
      { property: "og:title", content: "إنشاء حساب | رواسي" },
      { property: "og:description", content: "انضم إلى منصة رواسي." },
    ],
  }),
  component: () => <PlaceholderPage title={useLanguage().t("page.signup")} />,
});
