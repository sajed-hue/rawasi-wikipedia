import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Archive, ArrowLeft, ArrowRight, Bookmark, CheckCircle2, Clock3, FilePen, FileText, Image as ImageIcon, Pencil, Plus, RefreshCw, Search, Send, Trash2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AccessNotice } from "@/components/AccessNotice";
import { AuthImage } from "@/components/AuthImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getSavedIds, toggleSaved } from "@/data/saved";
import { apiErrorMessage } from "@/lib/api/messages";
import { archivePost, deletePost, submitPost } from "@/lib/api/posts";
import { useCategoryIndex, useInvalidatePosts, useMyPosts, useSavedPosts } from "@/lib/api/queries";
import type { HeritagePostDto } from "@/lib/api/types";
import { useLanguage } from "@/lib/i18n";
import { useMockAuth } from "@/lib/mock-auth";
import "@/components/contributions.css";
import { AccountCard } from "@/components/AccountCard";

export const Route = createFileRoute("/my-contributions")({
  head: () => ({
    meta: [
      { title: "مشاركاتي | رواسي" },
      { name: "description", content: "مشاركاتي في رواسي: حكايات التراث الفلسطيني المنشورة والمساهمات قيد المراجعة." },
      { property: "og:title", content: "مشاركاتي | رواسي" },
      { property: "og:description", content: "تابع مشاركاتك وساهم في حفظ حكايات التراث الفلسطيني." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContributionsPage,
});

const copy = {
  ar: {
    title: "مشاركاتي",
    subtitle: "شارك حكايتك وساهم في حفظ تراثنا الفلسطيني",
    add: "إضافة مشاركة",
    tabMine: "مشاركاتي",
    tabSaved: "المحفوظة",
    publishedStat: "تم نشرها",
    total: "إجمالي المشاركات",
    recent: "مشاركاتي الأخيرة",
    search: "ابحث في مشاركاتك",
    all: "الكل",
    draft: "مسودة",
    pending: "قيد المراجعة",
    published: "منشورة",
    rejected: "مرفوضة",
    archived: "مؤرشفة",
    details: "عرض التفاصيل",
    empty: "لا توجد مشاركات تطابق بحثك",
    none: "لم ترسل أي مشاركة بعد. اضغط «إضافة مشاركة» للبدء.",
    reset: "عرض كل المشاركات",
    edit: "تعديل",
    proposeEdit: "اقتراح تعديل",
    submitNow: "إرسال للمراجعة",
    archive: "أرشفة",
    delete: "حذف",
    deleteTitle: "حذف المشاركة؟",
    deleteWarn: "ستُحذف من الموقع ومن قائمتك ولا يمكن التراجع عن ذلك.",
    cancel: "إلغاء",
    confirmDelete: "نعم، احذف",
    deleted: "تم حذف المشاركة.",
    archivedMsg: "تمت أرشفة المشاركة وإخفاؤها من الموقع.",
    submittedMsg: "أُرسلت المشاركة للمراجعة.",
    loading: "جارٍ تحميل مشاركاتك...",
    loadError: "تعذّر تحميل مشاركاتك.",
    retry: "إعادة المحاولة",
    savedEmpty: "لم تحفظ أي مقال بعد. اضغط على علامة الحفظ في أي مقال.",
    open: "فتح المقال",
    unsave: "إزالة",
    statusGroup: "حالة المشاركة",
  },
  en: {
    title: "My Contributions",
    subtitle: "Share your story and help preserve our Palestinian heritage",
    add: "Add contribution",
    tabMine: "My contributions",
    tabSaved: "Saved",
    publishedStat: "Published",
    total: "Total contributions",
    recent: "My recent contributions",
    search: "Search your contributions",
    all: "All",
    draft: "Draft",
    pending: "Under review",
    published: "Published",
    rejected: "Rejected",
    archived: "Archived",
    details: "View details",
    empty: "No contributions match your search",
    none: "You haven't submitted anything yet. Click “Add contribution” to start.",
    reset: "Show all contributions",
    edit: "Edit",
    proposeEdit: "Propose an edit",
    submitNow: "Submit for review",
    archive: "Archive",
    delete: "Delete",
    deleteTitle: "Delete this contribution?",
    deleteWarn: "It will be removed from the site and your list. This can't be undone.",
    cancel: "Cancel",
    confirmDelete: "Yes, delete",
    deleted: "The contribution was deleted.",
    archivedMsg: "The contribution was archived and hidden from the site.",
    submittedMsg: "The contribution was sent for review.",
    loading: "Loading your contributions...",
    loadError: "We couldn't load your contributions.",
    retry: "Try again",
    savedEmpty: "You haven't saved any article yet. Click the bookmark on any article.",
    open: "Open article",
    unsave: "Remove",
    statusGroup: "Contribution status",
  },
};

type SubmissionStatus = "draft" | "pending" | "published" | "rejected" | "archived";
type Status = "all" | SubmissionStatus;
const FILTERS: Status[] = ["all", "draft", "pending", "published", "rejected", "archived"];

/** Backend HeritagePostStatus (0–4) -> this page's label key. */
const STATUS_BY_CODE: Record<number, SubmissionStatus> = {
  0: "draft",
  1: "pending",
  2: "published",
  3: "rejected",
  4: "archived",
};

const BADGE_CLASS: Record<SubmissionStatus, string> = {
  draft: "bg-secondary text-primary",
  pending: "contribution-pending",
  published: "contribution-published",
  rejected: "contribution-rejected",
  archived: "bg-muted text-muted-foreground",
};

const STATUS_ICON = {
  draft: FilePen,
  pending: Clock3,
  published: CheckCircle2,
  rejected: XCircle,
  archived: Archive,
} as const;

/** Turns a backend post into the card shape this page displays. */
function toSubmission(p: HeritagePostDto, categoryName: (id: string, lang: "ar" | "en") => string) {
  const text = (lang: "ar" | "en") => ({ title: p.title, category: categoryName(p.categoryId, lang), excerpt: p.summary, body: p.content });
  return { id: p.id, status: STATUS_BY_CODE[p.status] ?? "draft", rawStatus: p.status, ar: text("ar"), en: text("en") };
}
type Submission = ReturnType<typeof toSubmission>;

function NoPhoto({ className = "" }: { className?: string }) {
  return (
    <div className={`grid place-items-center bg-secondary text-muted-foreground/60 ${className}`}>
      <ImageIcon className="h-10 w-10" />
    </div>
  );
}

/**
 * My Contributions: a light profile page for logged-in users.
 * - "My contributions" tab: GET /api/users/me/heritage-posts (every status).
 * - "Saved" tab: bookmarked articles (ids kept in the browser, posts from the API).
 */
function ContributionsPage() {
  const { isLoggedIn, isReady } = useMockAuth();
  const { lang, dir } = useLanguage();
  const t = copy[lang];
  const [tab, setTab] = useState<"mine" | "saved">("mine");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Status>("all");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [deleting, setDeleting] = useState<Submission | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const { index: catIndex } = useCategoryIndex();
  // Personal lists are small; fetch up to the backend's page maximum and filter locally.
  const myPosts = useMyPosts({ page: 1, pageSize: 100 }, isLoggedIn);
  const saved = useSavedPosts(savedIds);
  const invalidate = useInvalidatePosts();

  useEffect(() => setSavedIds(getSavedIds()), []);

  const onError = (error: unknown) => setNotice({ kind: "error", text: apiErrorMessage(error, lang) });
  const deleteMutation = useMutation({ mutationFn: deletePost, onError });
  const archiveMutation = useMutation({ mutationFn: archivePost, onError });
  const submitMutation = useMutation({ mutationFn: submitPost, onError });
  const busy = deleteMutation.isPending || archiveMutation.isPending || submitMutation.isPending;

  /** handleDelete: soft-deletes the post chosen in the confirmation popup. */
  async function handleDelete() {
    if (!deleting) return;
    const target = deleting;
    try {
      await deleteMutation.mutateAsync(target.id);
      setDeleting(null);
      setSelected(null);
      setNotice({ kind: "ok", text: t.deleted });
      await invalidate(target.id);
    } catch {
      setDeleting(null); // onError already set the message
    }
  }

  async function handleArchive(id: string) {
    try {
      await archiveMutation.mutateAsync(id);
      setNotice({ kind: "ok", text: t.archivedMsg });
      await invalidate(id);
    } catch {
      // onError already set the message
    }
  }

  async function handleSubmit(id: string) {
    try {
      await submitMutation.mutateAsync(id);
      setNotice({ kind: "ok", text: t.submittedMsg });
      await invalidate(id);
    } catch {
      // onError already set the message (e.g. 409 if the state changed)
      await invalidate(id);
    }
  }

  /** handleUnsave: removes an article from the saved list. */
  function handleUnsave(id: string) {
    setSavedIds(toggleSaved(id));
  }

  // Guards go after all the hooks above (React needs hooks to run every time).
  if (!isReady) return null;
  if (!isLoggedIn) return <AccessNotice />;

  const submissions = (myPosts.data?.items ?? []).map((p) => toSubmission(p, catIndex.name));
  const needle = query.trim().toLocaleLowerCase(lang);
  const visible = submissions.filter((s) => (filter === "all" || s.status === filter) && `${s[lang].title} ${s[lang].category} ${s[lang].excerpt}`.toLocaleLowerCase(lang).includes(needle));
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const stats = [
    { label: t.publishedStat, count: submissions.filter((s) => s.status === "published").length, icon: CheckCircle2, tone: "contribution-published" },
    { label: t.pending, count: submissions.filter((s) => s.status === "pending").length, icon: Clock3, tone: "contribution-pending" },
    { label: t.total, count: myPosts.data?.totalCount ?? submissions.length, icon: FileText, tone: "bg-secondary text-primary" },
  ];

  return (
    <div className="contributions-page mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12" dir={dir}>
          <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div className="sm:text-start"><h1 className="font-display text-3xl leading-relaxed text-primary sm:text-4xl">{t.title}</h1><p className="mt-2 text-muted-foreground">{t.subtitle}</p></div>
        <Button asChild className="h-11 self-start rounded-full px-6 sm:self-auto"><Link to="/contribute"><Plus />{t.add}</Link></Button>
      </header>

      <div className="mt-8">
        <AccountCard />
      </div>

      {notice && (
        <p role={notice.kind === "error" ? "alert" : "status"} className={`mt-6 rounded-2xl px-4 py-3 text-sm ${notice.kind === "error" ? "bg-destructive/10 text-destructive" : "bg-secondary text-primary"}`}>
          {notice.text}
        </p>
      )}

      <div className="mt-8 flex gap-2 border-b border-border" role="tablist">
        {(["mine", "saved"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
          >
            {key === "mine" ? t.tabMine : t.tabSaved}
            {key === "saved" ? ` (${saved.posts.length})` : ""}
          </button>
        ))}
      </div>

      {tab === "mine" && (
        <>
          <section aria-label={t.total} className="mt-9 grid gap-4 sm:grid-cols-3">
            {stats.map(({ label, count, icon: Icon, tone }) => <div key={label} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"><span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${tone}`}><Icon className="h-7 w-7" /></span><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-bold tabular-nums text-foreground">{count}</p></div></div>)}
          </section>

          <section className="mt-12" aria-labelledby="recent-contributions">
            <h2 id="recent-contributions" className="font-display text-xl text-primary sm:text-2xl">{t.recent}</h2>
            <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} aria-label={t.search} className="h-11 rounded-full bg-background ps-12" /></div>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t.statusGroup}>{FILTERS.map((status) => <Button key={status} variant={filter === status ? "default" : "outline"} aria-pressed={filter === status} onClick={() => setFilter(status)} className="rounded-full px-4">{t[status]}</Button>)}</div>
            </div>

            {myPosts.isLoading && <p className="py-16 text-center text-muted-foreground" aria-busy="true">{t.loading}</p>}

            {myPosts.isError && (
              <div className="py-16 text-center">
                <p className="text-muted-foreground">{t.loadError}</p>
                <Button variant="outline" className="mt-4 rounded-full" onClick={() => void myPosts.refetch()}><RefreshCw />{t.retry}</Button>
              </div>
            )}

            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
              {visible.map((submission) => {
                const text = submission[lang];
                const StatusIcon = STATUS_ICON[submission.status];
                const canEdit = submission.rawStatus === 0 || submission.rawStatus === 3;
                return (
                  <article key={submission.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <AuthImage postId={submission.id} alt={text.title} className="h-full w-full object-cover" fallback={<NoPhoto className="h-full w-full" />} />
                      <span className={`absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${BADGE_CLASS[submission.status]}`}><StatusIcon className="h-3.5 w-3.5" />{t[submission.status]}</span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-lg leading-relaxed text-foreground">{text.title}</h3>
                      <p className="mt-3 flex items-center gap-2 text-xs text-primary"><FileText className="h-4 w-4 shrink-0" />{text.category}</p>
                      <p className="mt-3 line-clamp-1 text-sm text-muted-foreground" title={text.excerpt}>{text.excerpt}</p>
                      <Button variant="link" onClick={() => setSelected(submission)} className="mt-4 h-auto justify-start self-start p-0 text-tatreez">{t.details}<Arrow /></Button>
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                        {submission.rawStatus === 0 && (
                          <Button size="sm" disabled={busy} onClick={() => void handleSubmit(submission.id)} className="rounded-full"><Send />{t.submitNow}</Button>
                        )}
                        {canEdit && (
                          <Button asChild variant="outline" size="sm" className="rounded-full">
                            <Link to="/contribute" search={{ edit: submission.id }}><Pencil />{t.edit}</Link>
                          </Button>
                        )}
                        {submission.rawStatus === 2 && (
                          <>
                            <Button asChild variant="outline" size="sm" className="rounded-full">
                              <Link to="/contribute" search={{ edit: submission.id }}><Pencil />{t.proposeEdit}</Link>
                            </Button>
                            <Button variant="outline" size="sm" disabled={busy} onClick={() => void handleArchive(submission.id)} className="rounded-full"><Archive />{t.archive}</Button>
                          </>
                        )}
                        <Button variant="outline" size="sm" disabled={busy} onClick={() => setDeleting(submission)} className="rounded-full text-destructive"><Trash2 />{t.delete}</Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {myPosts.isSuccess && visible.length === 0 && <div className="py-16 text-center"><FileText className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-4 text-muted-foreground">{submissions.length === 0 ? t.none : t.empty}</p>{submissions.length > 0 && <Button variant="link" className="mt-3" onClick={() => { setFilter("all"); setQuery(""); }}>{t.reset}</Button>}</div>}
          </section>
        </>
      )}

      {tab === "saved" && (
        <section className="mt-8" aria-live="polite">
          {!saved.isLoading && saved.posts.length === 0 && (
            <div className="py-16 text-center">
              <Bookmark className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">{t.savedEmpty}</p>
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {saved.posts.map((a) => (
              <article key={a.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
                <div className="aspect-[16/10] overflow-hidden">
                  <AuthImage postId={a.id} alt={a.title} className="h-full w-full object-cover" fallback={<NoPhoto className="h-full w-full" />} />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg leading-relaxed text-foreground">{a.title}</h3>
                  <p className="mt-3 text-xs text-primary">{catIndex.name(a.categoryId, lang)}</p>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{a.summary}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    <Button asChild variant="outline" size="sm" className="rounded-full">
                      <Link to="/article/$id" params={{ id: a.id }}>{t.open}</Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleUnsave(a.id)} className="rounded-full"><Bookmark className="fill-current" />{t.unsave}</Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent dir={dir} className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border-border shadow-[var(--shadow-card)]">
          {selected && <><DialogTitle className="pe-5 text-start font-display leading-relaxed tracking-normal text-primary">{selected[lang].title}</DialogTitle><DialogDescription className="text-start">{selected[lang].category} · {t[selected.status]}</DialogDescription><AuthImage postId={selected.id} alt={selected[lang].title} className="aspect-[16/10] w-full rounded-xl object-cover" fallback={<NoPhoto className="aspect-[16/10] w-full rounded-xl" />} /><p className="whitespace-pre-line text-sm leading-8 text-foreground">{selected[lang].body}</p></>}
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <DialogContent dir={dir} className="w-[calc(100%-2rem)] rounded-2xl">
          <DialogTitle className="text-start font-display text-primary">{t.deleteTitle}</DialogTitle>
          <DialogDescription className="text-start">{deleting ? `${deleting[lang].title} — ${t.deleteWarn}` : ""}</DialogDescription>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>{t.cancel}</Button>
            <Button onClick={() => void handleDelete()} disabled={deleteMutation.isPending} className="bg-destructive text-white hover:bg-destructive/90">{t.confirmDelete}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
