import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Calendar, Check, ImageIcon, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  approveArticle,
  getPendingArticles,
  rejectArticle,
  type Article,
} from "@/data/articles";
import { categories, categoryLabel} from "@/data/categories";
import { useLanguage } from "@/lib/i18n";
import { useMockAuth } from "@/lib/mock-auth";


/**
 * Admin review page (/admin). Admins only.
 * Shows articles waiting for review (status 1). The admin can:
 * - approve: the article becomes public (status 2)
 * - reject: needs a written reason; the article becomes status 3
 */
export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const copy = {
  ar: {
    title: "لوحة المراجعة",
    subtitle: "راجع المقالات المرسلة ووافق عليها أو ارفضها.",
    count: "مقالات بانتظار المراجعة",
    empty: "لا توجد مقالات بانتظار المراجعة",
    submitted: "أُرسل في",
    readFull: "عرض النص الكامل",
    approve: "موافقة",
    reject: "رفض",
    approvedMsg: "تمت الموافقة على",
    rejectedMsg: "تم رفض",
    rejectTitle: "رفض المقال",
    reasonPlaceholder: "اكتب سبب الرفض ليتمكن الكاتب من فهمه...",
    reasonError: "سبب الرفض مطلوب (3 أحرف على الأقل)",
    cancel: "إلغاء",
    confirmReject: "تأكيد الرفض",
  },
  en: {
    title: "Review dashboard",
    subtitle: "Review submitted articles and approve or reject them.",
    count: "articles waiting for review",
    empty: "No articles are waiting for review",
    submitted: "Submitted on",
    readFull: "Show full text",
    approve: "Approve",
    reject: "Reject",
    approvedMsg: "Approved:",
    rejectedMsg: "Rejected:",
    rejectTitle: "Reject article",
    reasonPlaceholder: "Write the reason so the author can understand it...",
    reasonError: "A reason is required (at least 3 characters)",
    cancel: "Cancel",
    confirmReject: "Confirm rejection",
  },
};

function AdminPage() {
  const { lang, dir } = useLanguage();
  const t = copy[lang];
  const { isAdmin, isReady } = useMockAuth();
  const [pending, setPending] = useState<Article[] | null>(null);
  const [notice, setNotice] = useState("");
  const [rejecting, setRejecting] = useState<Article | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);
  const [busy, setBusy] = useState(false);

  /** Reloads the queue of pending articles. */
  async function refresh() {
    setPending(await getPendingArticles());
  }

  // Load the queue once we know the user is an admin.
  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin]);

  /** handleApprove: approves one article, then refreshes the queue. */
  async function handleApprove(article: Article) {
    setBusy(true);
    await approveArticle(article.id);
    await refresh();
    setBusy(false);
    setNotice(`${t.approvedMsg} ${article.title}`);
  }

  /** closeReject: closes the rejection popup and clears what was typed. */
  function closeReject() {
    setRejecting(null);
    setReason("");
    setReasonError(false);
  }

  /** handleReject: needs a reason; rejects the article, then refreshes. */
  async function handleReject() {
    if (!rejecting) return;
    if (reason.trim().length < 3) {
      setReasonError(true);
      return;
    }
    const title = rejecting.title;
    setBusy(true);
    await rejectArticle(rejecting.id, reason.trim());
    closeReject();
    await refresh();
    setBusy(false);
    setNotice(`${t.rejectedMsg} ${title}`);
  }

  // Guards go AFTER all hooks above (React needs hooks to run every time).
  if (!isReady) return null;
  if (!isAdmin) return <Navigate to="/" />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6" dir={dir}>
      <header>
        <h1 className="font-display text-3xl text-primary sm:text-4xl">{t.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.subtitle}</p>
        {pending && pending.length > 0 && (
          <p className="mt-4 inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-primary">
            {pending.length} {t.count}
          </p>
        )}
      </header>

      {notice && (
        <p
          role="status"
          className="mt-6 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-primary"
        >
          {notice}
        </p>
      )}

      {pending && pending.length === 0 && (
        <p className="mt-10 rounded-3xl border border-dashed border-border bg-card py-16 text-center text-muted-foreground">
          {t.empty}
        </p>
      )}

      <div className="mt-8 space-y-6">
        {pending?.map((a) => {
          const category = categories.find((c) => c.id === a.categoryId);
          const date = new Date(a.updatedAt).toLocaleDateString(lang === "ar" ? "ar" : "en-GB", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          return (
            <article
              key={a.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] sm:flex"
            >
              <div className="aspect-[16/10] min-h-40 bg-secondary sm:aspect-auto sm:w-56 sm:shrink-0">
                {a.imageUrl ? (
                  <img src={a.imageUrl} alt={a.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-muted-foreground/60">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col p-5">
                <h2 className="font-display text-xl leading-relaxed text-foreground">{a.title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {category && (
                    <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                      {categoryLabel(category, lang)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {t.submitted} {date}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{a.summary}</p>

                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer font-semibold text-primary">{t.readFull}</summary>
                  <div className="mt-2 space-y-3 leading-7 text-foreground">
                    {a.content.split("\n\n").map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </details>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button onClick={() => handleApprove(a)} disabled={busy} className="rounded-full">
                    <Check />
                    {t.approve}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRejecting(a)}
                    disabled={busy}
                    className="rounded-full text-destructive"
                  >
                    <X />
                    {t.reject}
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Dialog open={rejecting !== null} onOpenChange={(open) => !open && closeReject()}>
        <DialogContent dir={dir} className="w-[calc(100%-2rem)] rounded-2xl">
          <DialogTitle className="text-start font-display text-primary">{t.rejectTitle}</DialogTitle>
          <DialogDescription className="text-start">{rejecting?.title}</DialogDescription>
          <Textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setReasonError(false);
            }}
            rows={4}
            placeholder={t.reasonPlaceholder}
          />
          {reasonError && <p className="text-sm text-destructive">{t.reasonError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeReject}>
              {t.cancel}
            </Button>
            <Button onClick={handleReject} disabled={busy}>
              {t.confirmReject}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}