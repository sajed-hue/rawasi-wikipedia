import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { ClipboardCheck, History, Tags, Users } from "lucide-react";

import { AuditPanel } from "@/components/admin/AuditPanel";
import { CategoriesPanel } from "@/components/admin/CategoriesPanel";
import { ModerationPanel } from "@/components/admin/ModerationPanel";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { useLanguage } from "@/lib/i18n";
import { useMockAuth } from "@/lib/mock-auth";

const TABS = ["moderation", "categories", "users", "audit"] as const;
type Tab = (typeof TABS)[number];

/**
 * Admin console (/admin). Admins only — the backend also enforces the role on
 * every endpoint (403), so this guard is UX, not security.
 * The active tab lives in the URL (?tab=...) so it survives refresh and can be linked.
 */
export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => {
    const tab = search["tab"];
    return typeof tab === "string" && (TABS as readonly string[]).includes(tab) ? { tab: tab as Tab } : {};
  },
  head: () => ({ meta: [{ title: "لوحة الإدارة | رواسي" }] }),
  component: AdminPage,
});

const copy = {
  ar: {
    title: "لوحة الإدارة",
    subtitle: "راجع المقالات، وأدِر التصنيفات والمستخدمين، وتابع سجل العمليات.",
    tabs: { moderation: "المراجعة", categories: "التصنيفات", users: "المستخدمون", audit: "سجل العمليات" } as Record<Tab, string>,
  },
  en: {
    title: "Admin console",
    subtitle: "Review articles, manage categories and users, and follow the activity log.",
    tabs: { moderation: "Moderation", categories: "Categories", users: "Users", audit: "Audit log" } as Record<Tab, string>,
  },
};

const TAB_ICONS = { moderation: ClipboardCheck, categories: Tags, users: Users, audit: History } as const;

function AdminPage() {
  const { lang, dir } = useLanguage();
  const t = copy[lang];
  const { isAdmin, isReady } = useMockAuth();
  const { tab = "moderation" } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin" });

  // Guards go AFTER all hooks above (React needs hooks to run every time).
  if (!isReady) return null;
  if (!isAdmin) return <Navigate to="/" />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6" dir={dir}>
      <header>
        <h1 className="font-display text-3xl text-primary sm:text-4xl">{t.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.subtitle}</p>
      </header>

      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
        {TABS.map((key) => {
          const Icon = TAB_ICONS[key];
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => void navigate({ search: { tab: key }, replace: true })}
              className={`-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
            >
              <Icon className="h-4 w-4" />
              {t.tabs[key]}
            </button>
          );
        })}
      </div>

      <section className="mt-8" role="tabpanel">
        {tab === "moderation" && <ModerationPanel enabled={isAdmin} />}
        {tab === "categories" && <CategoriesPanel enabled={isAdmin} />}
        {tab === "users" && <UsersPanel enabled={isAdmin} />}
        {tab === "audit" && <AuditPanel enabled={isAdmin} />}
      </section>
    </div>
  );
}
