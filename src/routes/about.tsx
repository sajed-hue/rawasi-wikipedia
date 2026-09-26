import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن | رواسي" },
      { name: "description", content: "تعرّف على فريق ورسالة منصة رواسي للتراث الفلسطيني." },
      { property: "og:title", content: "من نحن | رواسي" },
      { property: "og:description", content: "رسالة منصة رواسي لحفظ التراث الفلسطيني." },
    ],
  }),
  component: () => <PlaceholderPage title={useLanguage().t("page.about")} />,
});
