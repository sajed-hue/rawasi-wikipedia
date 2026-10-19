import { useMutation } from "@tanstack/react-query";
import { Calendar, Check, FilePen, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { approveRevision, rejectRevision } from "@/lib/api/admin";
import { useInvalidateAdmin, usePendingRevisions } from "@/lib/api/admin-queries";
import { apiErrorMessage } from "@/lib/api/messages";
import { isApiError } from "@/lib/api/problem";
import { useCategoryIndex } from "@/lib/api/queries";
import type { RevisionReviewDto } from "@/lib/api/types";
import { useLanguage } from "@/lib/i18n";
import { NoticeBar, Pager, QueryState, formatDate, type Notice } from "./shared";

export const REVISIONS_PAGE_SIZE = 10;
const REASON_MAX = 1000;

const copy = {
  ar: {
    empty: "لا توجد اقتراحات تعديل بانتظار المراجعة",
    intro: "المقال المنشور يبقى كما هو حتى توافق على التعديل.",
    version: "النسخة",
    proposedOn: "اقتُرح في",
    changeNote: "ملاحظة الكاتب",
    current: "الحالي",
    proposed: "المقترح",
    unchanged: "لم يتغيّر",
    fields: { title: "العنوان", summary: "الملخص", category: "التصنيف", content: "النص" },
    compareContent: "مقارنة النص كاملاً",
    approve: "اعتماد التعديل",
    reject: "رفض التعديل",
    approvedMsg: "اعتُمد التعديل وحُدّث المقال:",
    rejectedMsg: "رُفض التعديل، وبقي المقال كما هو:",
    alreadyReviewed: "تمت مراجعة هذا الاقتراح من قبل مشرف آخر أو لم يعد المقال منشوراً. حُدّثت القائمة.",
    rejectTitle: "رفض اقتراح التعديل",
    reasonPlaceholder: "اكتب سبب الرفض ليتمكن الكاتب من فهمه...",
    reasonError: "سبب الرفض مطلوب (3 أحرف على الأقل)",
    cancel: "إلغاء",
    confirmReject: "تأكيد الرفض",
  },
  en: {
    empty: "No proposed edits are waiting for review",
    intro: "The published article stays unchanged until you approve the edit.",
    version: "Version",
    proposedOn: "Proposed on",
    changeNote: "Author's note",
    current: "Current",
    proposed: "Proposed",
    unchanged: "Unchanged",
    fields: { title: "Title", summary: "Summary", category: "Category", content: "Text" },
    compareContent: "Compare the full text",
    approve: "Approve edit",
    reject: "Reject edit",
    approvedMsg: "Edit approved and the article updated:",
    rejectedMsg: "Edit rejected; the article is unchanged:",
    alreadyReviewed: "Another admin already reviewed this edit, or the article is no longer published. The list was refreshed.",
    rejectTitle: "Reject proposed edit",
    reasonPlaceholder: "Write the reason so the author can understand it...",
    reasonError: "A reason is required (at least 3 characters)",
    cancel: "Cancel",
    confirmReject: "Confirm rejection",
  },
};

/** One field's current vs proposed value; collapses to "Unchanged" when equal. */
function FieldDiff({ label, current, proposed, t }: { label: string; current: string; proposed: string; t: (typeof copy)["ar"] }) {
  const changed = current !== proposed;
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs font-semibold text-primary">{label}</p>
      {changed ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg bg-muted px-3 py-2">
            <p className="text-[11px] font-semibold text-muted-foreground">{t.current}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground line-through decoration-muted-foreground/40">{current}</p>
          </div>
          <div className="rounded-lg bg-secondary px-3 py-2">
            <p className="text-[11px] font-semibold text-primary">{t.proposed}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-foreground">{proposed}</p>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">{t.unchanged}</p>
      )}
    </div>
  );
}

export function RevisionsQueue({ enabled }: { enabled: boolean }) {
  const { lang, dir } = useLanguage();
  const t = copy[lang];
  const [page, setPage] = useState(1);
  const revisions = usePendingRevisions(page, REVISIONS_PAGE_SIZE, enabled);
  const { index: catIndex } = useCategoryIndex();
  const invalidate = useInvalidateAdmin();

  const [notice, setNotice] = useState<Notice>(null);
  const [rejecting, setRejecting] = useState<RevisionReviewDto | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);

  const approve = useMutation({ mutationFn: (id: string) => approveRevision(id) });
  const reject = useMutation({ mutationFn: (args: { id: string; reason: string }) => rejectRevision(args.id, { reason: args.reason }) });
  const busy = approve.isPending || reject.isPending;

  const data = revisions.data;
  useEffect(() => {
    if (data && data.items.length === 0 && page > 1) setPage((p) => p - 1);
  }, [data, page]);

  const categoryName = (id: string) => catIndex.name(id, lang) || id.slice(0, 8);

  function reportError(error: unknown) {
    const stale = isApiError(error) && (error.kind === "conflict" || error.kind === "notFound");
    setNotice({ kind: "error", text: stale ? t.alreadyReviewed : apiErrorMessage(error, lang) });
  }

  async function handleApprove(r: RevisionReviewDto) {
    setNotice(null);
    try {
      await approve.mutateAsync(r.revisionId);
      setNotice({ kind: "ok", text: `${t.approvedMsg} ${r.title}` });
    } catch (error) {
      reportError(error);
    } finally {
      await invalidate("moderation");
    }
  }

  function closeReject() {
    setRejecting(null);
    setReason("");
    setReasonError(false);
  }

  async function handleReject() {
    if (!rejecting) return;
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setReasonError(true);
      return;
    }
    const target = rejecting;
    setNotice(null);
    try {
      await reject.mutateAsync({ id: target.revisionId, reason: trimmed });
      closeReject();
      setNotice({ kind: "ok", text: `${t.rejectedMsg} ${target.currentTitle}` });
    } catch (error) {
      closeReject();
      reportError(error);
    } finally {
      await invalidate("moderation");
    }
  }

  return (
    <div dir={dir}>
      <p className="text-sm text-muted-foreground">{t.intro}</p>
      <div className="mt-4"><NoticeBar notice={notice} /></div>

      <QueryState isLoading={revisions.isLoading} isError={revisions.isError} onRetry={() => void revisions.refetch()} lang={lang} />

      {data && data.items.length === 0 && (
        <p className="mt-6 rounded-3xl border border-dashed border-border bg-card py-16 text-center text-muted-foreground">{t.empty}</p>
      )}

      <div className="mt-6 space-y-6">
        {data?.items.map((r) => (
          <article key={r.revisionId} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-display text-xl leading-relaxed text-foreground">{r.currentTitle}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
                <FilePen className="h-3.5 w-3.5" />
                {t.version} {r.version}
              </span>
            </div>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {t.proposedOn} {formatDate(r.createdAt, lang)}
            </p>

            <div className="mt-4 rounded-xl bg-secondary/60 px-4 py-3">
              <p className="text-xs font-semibold text-primary">{t.changeNote}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-foreground">{r.changeDescription}</p>
            </div>

            <div className="mt-4 space-y-3">
              <FieldDiff label={t.fields.title} current={r.currentTitle} proposed={r.title} t={t} />
              <FieldDiff label={t.fields.summary} current={r.currentSummary} proposed={r.summary} t={t} />
              <FieldDiff label={t.fields.category} current={categoryName(r.currentCategoryId)} proposed={categoryName(r.categoryId)} t={t} />
              {r.currentContent === r.content ? (
                <FieldDiff label={t.fields.content} current={r.currentContent} proposed={r.content} t={t} />
              ) : (
                <details className="rounded-xl border border-border p-3 text-sm">
                  <summary className="cursor-pointer text-xs font-semibold text-primary">{t.fields.content} · {t.compareContent}</summary>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div className="max-h-96 overflow-y-auto rounded-lg bg-muted px-3 py-2">
                      <p className="text-[11px] font-semibold text-muted-foreground">{t.current}</p>
                      <p className="mt-1 whitespace-pre-line leading-7 text-muted-foreground">{r.currentContent}</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto rounded-lg bg-secondary px-3 py-2">
                      <p className="text-[11px] font-semibold text-primary">{t.proposed}</p>
                      <p className="mt-1 whitespace-pre-line leading-7 text-foreground">{r.content}</p>
                    </div>
                  </div>
                </details>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => void handleApprove(r)} disabled={busy} className="rounded-full">
                <Check />
                {t.approve}
              </Button>
              <Button variant="outline" onClick={() => setRejecting(r)} disabled={busy} className="rounded-full text-destructive">
                <X />
                {t.reject}
              </Button>
            </div>
          </article>
        ))}
      </div>

      {data && <Pager page={page} totalPages={data.totalPages} onPage={setPage} lang={lang} />}

      <Dialog open={rejecting !== null} onOpenChange={(open) => !open && closeReject()}>
        <DialogContent dir={dir} className="w-[calc(100%-2rem)] rounded-2xl">
          <DialogTitle className="text-start font-display text-primary">{t.rejectTitle}</DialogTitle>
          <DialogDescription className="text-start">{rejecting?.currentTitle}</DialogDescription>
          <Textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setReasonError(false);
            }}
            maxLength={REASON_MAX}
            rows={4}
            placeholder={t.reasonPlaceholder}
          />
          {reasonError && <p className="text-sm text-destructive">{t.reasonError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeReject}>{t.cancel}</Button>
            <Button onClick={() => void handleReject()} disabled={busy}>{t.confirmReject}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
