import { useMutation } from "@tanstack/react-query";
import { UserCheck, UserX } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { activateUser, deactivateUser } from "@/lib/api/admin";
import { useAdminUsers, useInvalidateAdmin } from "@/lib/api/admin-queries";
import { apiErrorMessage } from "@/lib/api/messages";
import type { UserProfileDto, UserRole } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { NoticeBar, Pager, QueryState, formatDate, type Notice } from "./shared";

const PAGE_SIZE = 20;
type RoleFilter = "all" | UserRole;
type StatusFilter = "all" | "active" | "inactive";

const copy = {
  ar: {
    roleNote: "لا يمكن تغيير الأدوار من الواجهة؛ الخادم لا يوفّر ذلك، ويتم عبر قاعدة البيانات.",
    role: "الدور",
    status: "الحالة",
    all: "الكل",
    roles: { User: "مستخدم", Contributor: "مساهم", Admin: "مشرف" } as Record<UserRole, string>,
    activeOnly: "مفعّلون",
    inactiveOnly: "معطّلون",
    active: "مفعّل",
    inactive: "معطّل",
    joined: "انضم في",
    you: "أنت",
    empty: "لا يوجد مستخدمون بهذه الشروط.",
    activate: "تفعيل",
    deactivate: "تعطيل",
    activated: "تم تفعيل الحساب.",
    deactivated: "تم تعطيل الحساب.",
    confirmTitle: "تعطيل هذا الحساب؟",
    confirmText: "لن يتمكن من الدخول أو استخدام الموقع حتى تعيد تفعيله.",
    cancel: "إلغاء",
    confirm: "نعم، عطّل",
  },
  en: {
    roleNote: "Roles can't be changed from the UI; the backend doesn't support it, so it's done in the database.",
    role: "Role",
    status: "Status",
    all: "All",
    roles: { User: "User", Contributor: "Contributor", Admin: "Admin" } as Record<UserRole, string>,
    activeOnly: "Active",
    inactiveOnly: "Inactive",
    active: "Active",
    inactive: "Inactive",
    joined: "Joined",
    you: "You",
    empty: "No users match these filters.",
    activate: "Activate",
    deactivate: "Deactivate",
    activated: "The account was activated.",
    deactivated: "The account was deactivated.",
    confirmTitle: "Deactivate this account?",
    confirmText: "They won't be able to sign in or use the site until you reactivate them.",
    cancel: "Cancel",
    confirm: "Yes, deactivate",
  },
};

export function UsersPanel({ enabled }: { enabled: boolean }) {
  const { lang, dir } = useLanguage();
  const t = copy[lang];
  const { profile } = useAuth();
  const invalidate = useInvalidateAdmin();

  const [page, setPage] = useState(1);
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [notice, setNotice] = useState<Notice>(null);
  const [confirming, setConfirming] = useState<UserProfileDto | null>(null);

  const users = useAdminUsers(
    {
      pageNumber: page,
      pageSize: PAGE_SIZE,
      role: role === "all" ? undefined : role,
      isActive: status === "all" ? undefined : status === "active",
    },
    enabled,
  );

  const toggle = useMutation({
    mutationFn: (u: UserProfileDto) => (u.isActive ? deactivateUser(u.id) : activateUser(u.id)),
  });

  async function handleToggle(user: UserProfileDto) {
    setNotice(null);
    setConfirming(null);
    try {
      await toggle.mutateAsync(user);
      setNotice({ kind: "ok", text: user.isActive ? t.deactivated : t.activated });
    } catch (error) {
      setNotice({ kind: "error", text: apiErrorMessage(error, lang) });
    } finally {
      await invalidate("users");
    }
  }

  const data = users.data;

  return (
    <div dir={dir}>
      <p className="text-sm text-muted-foreground">{t.roleNote}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Select value={role} onValueChange={(v) => { setRole(v as RoleFilter); setPage(1); }}>
          <SelectTrigger className="w-44 rounded-full" aria-label={t.role}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.role}: {t.all}</SelectItem>
            {(["User", "Contributor", "Admin"] as const).map((r) => (
              <SelectItem key={r} value={r}>{t.roles[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v as StatusFilter); setPage(1); }}>
          <SelectTrigger className="w-44 rounded-full" aria-label={t.status}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.status}: {t.all}</SelectItem>
            <SelectItem value="active">{t.activeOnly}</SelectItem>
            <SelectItem value="inactive">{t.inactiveOnly}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6"><NoticeBar notice={notice} /></div>

      <QueryState isLoading={users.isLoading} isError={users.isError} onRetry={() => void users.refetch()} lang={lang} />

      {data && data.items.length === 0 && (
        <p className="mt-6 rounded-3xl border border-dashed border-border bg-card py-16 text-center text-muted-foreground">{t.empty}</p>
      )}

      <ul className={`mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] ${data && data.items.length === 0 ? "hidden" : ""}`}>
        {data?.items.map((u) => {
          const isSelf = profile?.id === u.id;
          return (
            <li key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {u.displayName || u.email}
                  {isSelf && <span className="ms-2 rounded-full bg-secondary px-2 py-0.5 text-xs text-primary">{t.you}</span>}
                </p>
                <p className="truncate text-sm text-muted-foreground" dir="ltr">{u.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.joined} {formatDate(u.createdAt, lang)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">{t.roles[u.role]}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${u.isActive ? "bg-secondary text-primary" : "bg-destructive/10 text-destructive"}`}>
                  {u.isActive ? t.active : t.inactive}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className={`rounded-full ${u.isActive ? "text-destructive" : ""}`}
                  disabled={toggle.isPending || (isSelf && u.isActive)}
                  onClick={() => (u.isActive ? setConfirming(u) : void handleToggle(u))}
                >
                  {u.isActive ? <UserX /> : <UserCheck />}
                  {u.isActive ? t.deactivate : t.activate}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {data && <Pager page={page} totalPages={data.totalPages} onPage={setPage} lang={lang} />}

      <Dialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent dir={dir} className="w-[calc(100%-2rem)] rounded-2xl">
          <DialogTitle className="text-start font-display text-primary">{t.confirmTitle}</DialogTitle>
          <DialogDescription className="text-start">{confirming ? `${confirming.displayName || confirming.email} — ${t.confirmText}` : ""}</DialogDescription>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirming(null)}>{t.cancel}</Button>
            <Button onClick={() => confirming && void handleToggle(confirming)} disabled={toggle.isPending} className="bg-destructive text-white hover:bg-destructive/90">
              {t.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
