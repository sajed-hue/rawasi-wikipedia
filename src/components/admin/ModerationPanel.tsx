import { useMutation } from "@tanstack/react-query";
import { Calendar, Check, ImageIcon, X } from "lucide-react";
import { useEffect, useState } from "react";

import { AuthImage } from "@/components/AuthImage";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { approvePost, rejectPost } from "@/lib/api/admin";
import { useInvalidateAdmin, usePendingPosts, usePendingRevisions, usePostForReview } from "@/lib/api/admin-queries";
import { apiErrorMessage } from "@/lib/api/messages";
import { isApiError } from "@/lib/api/problem";
import { useCategoryIndex } from "@/lib/api/queries";
import { ModerationDecision, type ModerationPostDto } from "@/lib/api/types";
import { useLanguage } from "@/lib/i18n";
import { REVISIONS_PAGE_SIZE, RevisionsQueue } from "./RevisionsQueue";
import { NoticeBar, Pager, QueryState, formatDate, type Notice } from "./shared";

const PAGE_SIZE = 10;
const REASON_MAX = 1000;

const copy = {
  ar: {
    count: "مقالات بانتظار المراجعة",
    empty: "لا توجد مقالات بانتظار المراجعة",
    submitted: "أُرسل في",
    readFull: "عرض النص الكامل والسجل",
    history: "سجل المراجعة",
    noHistory: "لا توجد قرارات سابقة على هذا المقال.",
    approvedDecision: "موافقة",
    rejectedDecision: "رفض",
    approve: "موافقة",
    reject: "رفض",
    approvedMsg: "تمت الموافقة على:",
    rejectedMsg: "تم رفض:",
    alreadyModerated: "تمت مراجعة هذا المقال من قبل مشرف آخر أو تغيّرت حالته. حُدّثت القائمة.",
    rejectTitle: "رفض المقال",
    reasonPlaceholder: "اكتب سبب الرفض ليتمكن الكاتب من فهمه...",
    reasonError: "سبب الرفض مطلوب (3 أحرف على الأقل)",
    cancel: "إلغاء",
    confirmReject: "تأكيد الرفض",
    loadingDetail: "جارٍ تحميل النص...",
  },
  en: {
    count: "articles waiting for review",
    empty: "No articles are waiting for review",
    submitted: "Submitted on",
    readFull: "Show full text and history",
    history: "Review history",
    noHistory: "No earlier decisions on this article.",
    approvedDecision: "Approved",
    rejectedDecision: "Rejected",
    approve: "Approve",
    reject: "Reject",
    approvedMsg: "Approved:",
    rejectedMsg: "Rejected:",
    alreadyModerated: "Another admin already reviewed this article or its state changed. The list was refreshed.",
    rejectTitle: "Reject article",
    reasonPlaceholder: "Write the reason so the author can understand it...",
    reasonError: "A reason is required (at least 3 characters)",
    cancel: "Cancel",
    confirmReject: "Confirm rejection",
    loadingDetail: "Loading text...",
  },
};

/** Expanded body of a queue card: full text + earlier decisions. Fetched on demand. */
function ReviewDetail({ postId }: { postId: string }) {
  const { lang } = useLanguage();
  const t = copy[lang];
  const detail = usePostForReview(postId, true);

  if (detail.isLoading) return <p className="mt-2 text-muted-foreground">{t.loadingDetail}</p>;
  if (detail.isError || !detail.data) return <p className="mt-2 text-destructive">{apiErrorMessage(detail.error, lang)}</p>;

  const { content, reviews } = detail.data;
  return (
    <div className="mt-2 space-y-4">
      <div className="space-y-3 leading-7 text-foreground">
        {content.split("\n\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div>
        <h3 className="font-semibold text-primary">{t.history}</h3>
        {reviews.length === 0 ? (
          <p className="mt-1 text-muted-foreground">{t.noHistory}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl bg-secondary px-3 py-2">
                <span className={r.decision === ModerationDecision.Approved ? "font-semibold text-primary" : "font-semibold text-destructive"}>
                  {r.decision === ModerationDecision.Approved ? t.approvedDecision : t.rejectedDecision}
                </span>
                <span className="text-muted-foreground"> · {formatDate(r.reviewedAt, lang, true)}</span>
                {r.reason && <p className="mt-1 text-foreground">{r.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const toggleCopy = {
  ar: { newPosts: "مقالات جديدة", edits: "اقتراحات تعديل", group: "نوع المراجعة" },
  en: { newPosts: "New articles", edits: "Proposed edits", group: "Review type" },
};

/** Moderation tab: switch between new submissions and proposed edits, each with its count. */
export function ModerationPanel({ enabled }: { enabled: boolean }) {
  const { lang, dir } = useLanguage();
  const t = toggleCopy[lang];
  const [view, setView] = useState<"posts" | "revisions">("posts");
  // Page 1 of each queue (shared cache with the queues themselves) gives the badge counts.
  const postsCount = usePendingPosts({ page: 1, pageSize: PAGE_SIZE }, enabled).data?.totalCount;
  const revisionsCount = usePendingRevisions(1, REVISIONS_PAGE_SIZE, enabled).data?.totalCount;

  const options = [
    { key: "posts" as const, label: t.newPosts, count: postsCount },
    { key: "revisions" as const, label: t.edits, count: revisionsCount },
  ];

  return (
    <div dir={dir}>
      <div className="mb-6 inline-flex rounded-full border border-border bg-card p-1" role="group" aria-label={t.group}>
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            aria-pressed={view === o.key}
            onClick={() => setView(o.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${view === o.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"}`}
          >
            {o.label}
            {o.count !== undefined && <span className="ms-2 tabular-nums opacity-80">({o.count})</span>}
          </button>
        ))}
      </div>
      {view === "posts" ? <NewPostsQueue enabled={enabled} /> : <RevisionsQueue enabled={enabled} />}
    </div>
  );
}

function NewPostsQueue({ enabled }: { enabled: boolean }) {
  const { lang, dir } = useLanguage();
  const t = copy[lang];
  const [page, setPage] = useState(1);
  const pending = usePendingPosts({ page, pageSize: PAGE_SIZE }, enabled);
  const { index: catIndex } = useCategoryIndex();
  const invalidate = useInvalidateAdmin();

  const [notice, setNotice] = useState<Notice>(null);
  const [rejecting, setRejecting] = useState<ModerationPostDto | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const approve = useMutation({ mutationFn: (id: string) => approvePost(id) });
  const reject = useMutation({ mutationFn: (args: { id: string; reason: string }) => rejectPost(args.id, { reason: args.reason }) });
  const busy = approve.isPending || reject.isPending;

  const data = pending.data;
  // If the last item of a later page was moderated, step back a page.
  useEffect(() => {
    if (data && data.items.length === 0 && page > 1) setPage((p) => p - 1);
  }, [data, page]);

  function reportError(error: unknown) {
    const conflict = isApiError(error) && (error.kind === "conflict" || error.kind === "notFound");
    setNotice({ kind: "error", text: conflict ? t.alreadyModerated : apiErrorMessage(error, lang) });
  }

  async function handleApprove(post: ModerationPostDto) {
    setNotice(null);
    try {
      await approve.mutateAsync(post.id);
      setNotice({ kind: "ok", text: `${t.approvedMsg} ${post.title}` });
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
    const post = rejecting;
    setNotice(null);
    try {
      await reject.mutateAsync({ id: post.id, reason: trimmed });
      closeReject();
      setNotice({ kind: "ok", text: `${t.rejectedMsg} ${post.title}` });
    } catch (error) {
      closeReject();
      reportError(error);
    } finally {
      await invalidate("moderation");
    }
  }

  return (
    <div dir={dir}>
      {data && data.totalCount > 0 && (
        <p className="inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-primary">
          {data.totalCount} {t.count}
        </p>
      )}

      <div className="mt-6"><NoticeBar notice={notice} /></div>

      <QueryState isLoading={pending.isLoading} isError={pending.isError} onRetry={() => void pending.refetch()} lang={lang} />

      {data && data.items.length === 0 && (
        <p className="mt-6 rounded-3xl border border-dashed border-border bg-card py-16 text-center text-muted-foreground">{t.empty}</p>
      )}

      <div className="mt-6 space-y-6">
        {data?.items.map((a) => {
          const category = catIndex.byId.get(a.categoryId);
          return (
            <article key={a.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] sm:flex">
              <div className="aspect-[16/10] min-h-40 bg-secondary sm:aspect-auto sm:w-56 sm:shrink-0">
                <AuthImage
                  postId={a.id}
                  alt={a.title}
                  className="h-full w-full object-cover"
                  fallback={<div className="grid h-full w-full place-items-center text-muted-foreground/60"><ImageIcon className="h-10 w-10" /></div>}
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col p-5">
                <h2 className="font-display text-xl leading-relaxed text-foreground">{a.title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {category && (
                    <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                      {lang === "en" ? category.nameEn : category.name}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {t.submitted} {formatDate(a.submittedAt, lang)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{a.summary}</p>

                <details
                  className="mt-3 text-sm"
                  open={expanded === a.id}
                  onToggle={(e) => setExpanded((e.currentTarget as HTMLDetailsElement).open ? a.id : null)}
                >
                  <summary className="cursor-pointer font-semibold text-primary">{t.readFull}</summary>
                  {expanded === a.id && <ReviewDetail postId={a.id} />}
                </details>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button onClick={() => void handleApprove(a)} disabled={busy} className="rounded-full">
                    <Check />
                    {t.approve}
                  </Button>
                  <Button variant="outline" onClick={() => setRejecting(a)} disabled={busy} className="rounded-full text-destructive">
                    <X />
                    {t.reject}
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {data && <Pager page={page} totalPages={data.totalPages} onPage={setPage} lang={lang} />}

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
