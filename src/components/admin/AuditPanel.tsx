import { useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuditLogs } from "@/lib/api/admin-queries";
import { useLanguage } from "@/lib/i18n";
import { Pager, QueryState, formatDate, shortId } from "./shared";

const PAGE_SIZE = 20;

// The exact action / entity names the backend writes via IAuditService.LogAsync.
// Category and media changes are not audited by the backend.
const ACTIONS_BY_ENTITY = {
  HeritagePost: ["PostCreated", "PostUpdated", "PostSubmittedForReview", "PostApproved", "PostRejected", "PostArchived", "PostDeleted"],
  User: ["ProfileUpdated", "UserActivated", "UserDeactivated"],
} as const;
type Entity = keyof typeof ACTIONS_BY_ENTITY;

const ACTION_LABELS: Record<"ar" | "en", Record<string, string>> = {
  ar: {
    PostCreated: "إنشاء مقال",
    PostUpdated: "تعديل مقال",
    PostSubmittedForReview: "إرسال للمراجعة",
    PostApproved: "موافقة على مقال",
    PostRejected: "رفض مقال",
    PostArchived: "أرشفة مقال",
    PostDeleted: "حذف مقال",
    ProfileUpdated: "تعديل ملف شخصي",
    UserActivated: "تفعيل مستخدم",
    UserDeactivated: "تعطيل مستخدم",
  },
  en: {
    PostCreated: "Post created",
    PostUpdated: "Post updated",
    PostSubmittedForReview: "Submitted for review",
    PostApproved: "Post approved",
    PostRejected: "Post rejected",
    PostArchived: "Post archived",
    PostDeleted: "Post deleted",
    ProfileUpdated: "Profile updated",
    UserActivated: "User activated",
    UserDeactivated: "User deactivated",
  },
};

const copy = {
  ar: {
    note: "سجل غير قابل للتعديل لعمليات المقالات والمستخدمين. تعديلات التصنيفات والوسائط لا يسجّلها الخادم.",
    entity: "النوع",
    action: "الإجراء",
    all: "الكل",
    entities: { HeritagePost: "المقالات", User: "المستخدمون" } as Record<Entity, string>,
    when: "الوقت",
    actor: "المنفّذ",
    target: "العنصر",
    details: "التفاصيل",
    system: "النظام",
    empty: "لا توجد سجلات بهذه الشروط.",
  },
  en: {
    note: "Immutable log of post and user operations. Category and media changes are not recorded by the backend.",
    entity: "Type",
    action: "Action",
    all: "All",
    entities: { HeritagePost: "Posts", User: "Users" } as Record<Entity, string>,
    when: "When",
    actor: "Actor",
    target: "Target",
    details: "Details",
    system: "System",
    empty: "No log entries match these filters.",
  },
};

export function AuditPanel({ enabled }: { enabled: boolean }) {
  const { lang, dir } = useLanguage();
  const t = copy[lang];
  const labels = ACTION_LABELS[lang];

  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState<"all" | Entity>("all");
  const [action, setAction] = useState<string>("all");

  const logs = useAuditLogs(
    {
      page,
      pageSize: PAGE_SIZE,
      entityName: entity === "all" ? undefined : entity,
      action: action === "all" ? undefined : action,
    },
    enabled,
  );

  const actionOptions: readonly string[] =
    entity === "all" ? [...ACTIONS_BY_ENTITY.HeritagePost, ...ACTIONS_BY_ENTITY.User] : ACTIONS_BY_ENTITY[entity];
  const data = logs.data;

  return (
    <div dir={dir}>
      <p className="text-sm text-muted-foreground">{t.note}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Select value={entity} onValueChange={(v) => { setEntity(v as "all" | Entity); setAction("all"); setPage(1); }}>
          <SelectTrigger className="w-44 rounded-full" aria-label={t.entity}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.entity}: {t.all}</SelectItem>
            {(Object.keys(ACTIONS_BY_ENTITY) as Entity[]).map((e) => (
              <SelectItem key={e} value={e}>{t.entities[e]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
          <SelectTrigger className="w-52 rounded-full" aria-label={t.action}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.action}: {t.all}</SelectItem>
            {actionOptions.map((a) => (
              <SelectItem key={a} value={a}>{labels[a] ?? a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QueryState isLoading={logs.isLoading} isError={logs.isError} onRetry={() => void logs.refetch()} lang={lang} />

      {data && data.items.length === 0 && (
        <p className="mt-6 rounded-3xl border border-dashed border-border bg-card py-16 text-center text-muted-foreground">{t.empty}</p>
      )}

      {data && data.items.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-secondary text-start text-primary">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">{t.when}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.action}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.target}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.actor}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.details}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((log) => (
                <tr key={log.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(log.timestamp, lang, true)}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{labels[log.action] ?? log.action}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.entities[log.entityName as Entity] ?? log.entityName}{" "}
                    <code className="text-xs" dir="ltr" title={log.entityId}>{shortId(log.entityId)}</code>
                  </td>
                  <td className="px-4 py-3">
                    {log.userId ? <code className="text-xs" dir="ltr" title={log.userId}>{shortId(log.userId)}</code> : <span className="text-muted-foreground">{t.system}</span>}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-muted-foreground">
                    <span className="line-clamp-2 break-words" title={log.metadata ?? ""}>{log.metadata ?? "—"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pager page={page} totalPages={data.totalPages} onPage={setPage} lang={lang} />}
    </div>
  );
}
