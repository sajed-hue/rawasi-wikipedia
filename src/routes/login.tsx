import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | رواسي" },
      { name: "description", content: "سجّل دخولك إلى منصة رواسي للتراث الفلسطيني." },
      { property: "og:title", content: "تسجيل الدخول | رواسي" },
      { property: "og:description", content: "الدخول إلى حسابك على رواسي." },
    ],
  }),
  component: () => <PlaceholderPage title={useLanguage().t("page.login")} />,
});
