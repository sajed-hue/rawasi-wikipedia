import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ResearchKeywordsPanel } from "@/components/admin/ResearchKeywordsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminCategories } from "@/lib/api/admin-queries";
import { api } from "@/lib/api/client";
import { apiErrorMessage } from "@/lib/api/messages";
import { useInvalidatePosts } from "@/lib/api/queries";
import type { PagedResult } from "@/lib/api/types";
import { useLanguage } from "@/lib/i18n";

interface Submission {
  id: string;
  version: string;
  topic: string;
  sourceTitle: string;
  sourceUrl: string;
  categoryId: string;
  title: string;
  summary: string;
  content: string;
}

const endpoint = "/api/admin/research/submissions";
const key = ["admin", "research"];
const copy = {
  ar: {
    loading: "جارٍ تحميل النتائج…", empty: "لا توجد نتائج بانتظار الموافقة.",
    refresh: "تحديث القائمة", source: "نسخة المصدر", title: "العنوان", summary: "الملخص",
    content: "المحتوى", category: "التصنيف", choose: "اختر تصنيفًا نشطًا",
    save: "حفظ التعديلات", approve: "الموافقة والنشر", reject: "رفض النتيجة",
    reason: "سبب الرفض", approved: "تمت الموافقة ونشر المقال.", rejected: "رُفضت النتيجة.",
    saved: "حُفظت التعديلات والنتيجة ما زالت بانتظار الموافقة.",
    previous: "السابق", next: "التالي",
    confirm: "هل تريد نشر النسخة المحفوظة من هذه النتيجة على الموقع؟",
    unsaved: "احفظ تعديلاتك قبل الموافقة.",
  },
  en: {
    loading: "Loading submissions…", empty: "No submissions are pending approval.",
    refresh: "Refresh list", source: "Source revision", title: "Title", summary: "Summary",
    content: "Content", category: "Category", choose: "Choose an active category",
    save: "Save changes", approve: "Approve and publish", reject: "Reject submission",
    reason: "Reason for rejection", approved: "The article was approved and published.", rejected: "The submission was rejected.",
    saved: "Changes saved. The submission remains pending approval.",
    previous: "Previous", next: "Next",
    confirm: "Publish the saved version of this submission on the site?",
    unsaved: "Save your edits before approving.",
  },
};

export function ResearchPanel({ enabled }: { enabled: boolean }) {
  const { lang } = useLanguage();
  const t = copy[lang];
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const categories = useAdminCategories(enabled);
  const submissions = useQuery({
    queryKey: [...key, page],
    queryFn: ({ signal }) => api.get<PagedResult<Submission>>(endpoint, { query: { page }, auth: "required", signal }),
    enabled: enabled && typeof window !== "undefined",
  });
  const lastPage = Math.max(1, submissions.data?.totalPages ?? 1);

  return (
    <section className="space-y-4">
      <ResearchKeywordsPanel enabled={enabled} />
      <Button variant="outline" onClick={() => void submissions.refetch()} disabled={submissions.isFetching}>
        {t.refresh}
      </Button>
      {notice && <p role="status">{notice}</p>}
      {submissions.isPending && <p role="status">{t.loading}</p>}
      {submissions.isError && <p role="alert">{apiErrorMessage(submissions.error, lang)}</p>}
      {submissions.data?.items.length === 0 && <p>{t.empty}</p>}
      {submissions.data?.items.map((item) => (
        <SubmissionEditor key={item.version} item={item}
          categories={categories.data?.filter((category) => category.isActive) ?? []}
          onNotice={setNotice} />
      ))}
      {page > 1 || lastPage > 1 ? (
        <nav aria-label={lang === "ar" ? "صفحات نتائج البحث" : "Research result pages"} className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>{t.previous}</Button>
          <span>{page} / {lastPage}</span>
          <Button variant="outline" onClick={() => setPage(page + 1)} disabled={page >= lastPage}>{t.next}</Button>
        </nav>
      ) : null}
    </section>
  );
}

function SubmissionEditor({ item, categories, onNotice }: {
  item: Submission;
  categories: { id: string; name: string }[];
  onNotice: (notice: string) => void;
}) {
  const { lang } = useLanguage();
  const t = copy[lang];
  const queryClient = useQueryClient();
  const invalidatePosts = useInvalidatePosts();
  const [title, setTitle] = useState(item.title);
  const [summary, setSummary] = useState(item.summary);
  const [content, setContent] = useState(item.content);
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [reason, setReason] = useState("");
  const dirty = title !== item.title || summary !== item.summary || content !== item.content || categoryId !== item.categoryId;
  const path = `${endpoint}/${item.id}`;
  const review = useMutation({
    mutationFn: async (action: "edit" | "approve" | "reject") => {
      if (action === "edit") {
        await api.put<void>(path, { version: item.version, title, summary, content, categoryId }, { auth: "required", responseKind: "void" });
      } else if (action === "approve") {
        await api.post(`${path}/approve`, { version: item.version }, { auth: "required" });
      } else {
        await api.post<void>(`${path}/reject`, { version: item.version, reason }, { auth: "required", responseKind: "void" });
      }
    },
    onSuccess: async (_, action) => {
      onNotice(action === "edit" ? t.saved : action === "approve" ? t.approved : t.rejected);
      await queryClient.invalidateQueries({ queryKey: key });
      if (action === "approve") await invalidatePosts();
    },
  });

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dirty && !review.isPending) review.mutate("edit");
  }

  return (
    <article className="space-y-4 rounded-lg border border-border p-4">
      <h2 className="font-semibold">{item.title}</h2>
      <p className="text-sm text-muted-foreground">{item.topic}</p>
      <a className="break-words text-sm text-primary underline" href={item.sourceUrl} target="_blank" rel="noreferrer">
        {t.source} · {item.sourceTitle}
      </a>
      <form onSubmit={save} className="space-y-3">
        <Label className="flex flex-col items-stretch gap-1">{t.title}
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
        </Label>
        <Label className="flex flex-col items-stretch gap-1">{t.summary}
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={500} required />
        </Label>
        <Label className="flex flex-col items-stretch gap-1">{t.content}
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={49_000} rows={7} required />
        </Label>
        <Label className="flex flex-col items-stretch gap-1">{t.category}
          <select className="h-9 rounded-md border border-input bg-background px-3" value={categoryId} required
            onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">{t.choose}</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </Label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="outline" disabled={!dirty || review.isPending}>{t.save}</Button>
          <Button type="button" disabled={dirty || review.isPending}
            onClick={() => { if (window.confirm(t.confirm)) review.mutate("approve"); }}>{t.approve}</Button>
        </div>
        {dirty && <p className="text-sm text-muted-foreground">{t.unsaved}</p>}
      </form>
      <Label className="flex flex-col items-stretch gap-1">{t.reason}
        <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
      </Label>
      <Button variant="destructive" disabled={!reason.trim() || review.isPending} onClick={() => review.mutate("reject")}>
        {t.reject}
      </Button>
      {review.isError && <p role="alert">{apiErrorMessage(review.error, lang)}</p>}
    </article>
  );
}
