import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminCategories } from "@/lib/api/admin-queries";
import { api } from "@/lib/api/client";
import { apiErrorMessage } from "@/lib/api/messages";
import { isApiError } from "@/lib/api/problem";
import { useLanguage } from "@/lib/i18n";

interface Keyword {
  id: string;
  version: string;
  query: string;
  categoryId: string;
}

const endpoint = "/api/admin/research/keywords";
const queryKey = ["admin", "research-keywords"] as const;
const copy = {
  ar: {
    heading: "كلمات البحث",
    help: "يستخدم الوكيل الكلمات المحفوظة في دورة البحث القادمة.",
    query: "كلمة أو عبارة البحث",
    category: "التصنيف",
    choose: "اختر تصنيفًا نشطًا",
    add: "إضافة كلمة",
    edit: "تعديل",
    editing: "تعديل كلمة البحث",
    save: "حفظ التعديل",
    cancel: "إلغاء",
    retry: "إعادة التحميل",
    loading: "جارٍ تحميل كلمات البحث والتصنيفات…",
    saving: "جارٍ الحفظ…",
    empty: "لا توجد كلمات بحث محفوظة.",
    saved: "تم حفظ كلمة البحث.",
    noCategories: "أضف تصنيفًا نشطًا من تبويب التصنيفات أولًا.",
    inactive: "التصنيف غير نشط",
    conflict: "تحقّق من عدم تكرار الكلمة ومن أن التصنيف نشط. إذا عدّل مشرف آخر الكلمة، أعد تحميل القائمة واخترها من جديد.",
  },
  en: {
    heading: "Search keywords",
    help: "The agent uses saved keywords in its next search cycle.",
    query: "Search keyword or phrase",
    category: "Category",
    choose: "Choose an active category",
    add: "Add keyword",
    edit: "Edit",
    editing: "Edit search keyword",
    save: "Save changes",
    cancel: "Cancel",
    retry: "Reload",
    loading: "Loading keywords and categories…",
    saving: "Saving…",
    empty: "No search keywords have been saved.",
    saved: "Search keyword saved.",
    noCategories: "Add an active category from the Categories tab first.",
    inactive: "Inactive category",
    conflict: "Check for a duplicate keyword and an active category. If another admin edited the keyword, reload the list and select it again.",
  },
};

export function ResearchKeywordsPanel({ enabled }: { enabled: boolean }) {
  const { lang } = useLanguage();
  const t = copy[lang];
  const client = useQueryClient();
  const categories = useAdminCategories(enabled);
  const keywords = useQuery({
    queryKey,
    queryFn: ({ signal }) => api.get<Keyword[]>(endpoint, { auth: "required", signal }),
    enabled: enabled && typeof window !== "undefined",
  });
  const [editing, setEditing] = useState<Keyword | null>(null);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notice, setNotice] = useState("");
  const queryInput = useRef<HTMLInputElement>(null);
  const active = categories.data?.filter((category) => category.isActive) ?? [];
  const canSave = Boolean(query.trim()) && active.some((category) => category.id === categoryId);

  const save = useMutation({
    mutationFn: ({ item, query, categoryId }: { item: Keyword | null; query: string; categoryId: string }) =>
      item
        ? api.put<Keyword>(`${endpoint}/${item.id}`, { version: item.version, query, categoryId }, { auth: "required" })
        : api.post<Keyword>(endpoint, { query, categoryId }, { auth: "required" }),
    onSuccess: async () => {
      setEditing(null);
      setQuery("");
      setCategoryId("");
      setNotice(t.saved);
      await client.invalidateQueries({ queryKey });
    },
  });

  function select(item: Keyword | null) {
    save.reset();
    setEditing(item);
    setQuery(item?.query ?? "");
    setCategoryId(item?.categoryId ?? "");
    setNotice("");
    queryInput.current?.focus();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSave && !save.isPending) {
      setNotice("");
      save.mutate({ item: editing, query: query.trim(), categoryId });
    }
  }

  if (!enabled) return null;

  const loadError = keywords.error ?? categories.error;
  const saveConflict = isApiError(save.error) && save.error.kind === "conflict";
  return (
    <section className="space-y-4 rounded-lg border border-border p-4">
      <div>
        <h2 className="font-semibold">{t.heading}</h2>
        <p className="text-sm text-muted-foreground">{t.help}</p>
      </div>
      {(keywords.isPending || categories.isPending) && <p role="status">{t.loading}</p>}
      {loadError && (
        <div className="space-y-2">
          <p role="alert">{apiErrorMessage(loadError, lang)}</p>
          <Button type="button" variant="outline" onClick={() => {
            void keywords.refetch();
            void categories.refetch();
          }}>{t.retry}</Button>
        </div>
      )}
      {keywords.data?.length === 0 && <p className="text-sm text-muted-foreground">{t.empty}</p>}
      {Boolean(keywords.data?.length) && (
        <ul className="divide-y divide-border">
          {keywords.data?.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="break-words text-sm font-medium" dir="auto">{item.query}</p>
                <p className="break-words text-xs text-muted-foreground">
                  {active.find((category) => category.id === item.categoryId)?.name ?? t.inactive}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm"
                disabled={save.isPending}
                aria-label={`${t.edit} ${item.query}`} onClick={() => select(item)}>
                {t.edit}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {categories.isSuccess && active.length === 0 && <p className="text-sm text-muted-foreground">{t.noCategories}</p>}
      {keywords.isSuccess && categories.isSuccess && (
        <form onSubmit={submit} className="space-y-3 border-t border-border pt-4">
          {editing && <h3 className="text-sm font-semibold">{t.editing}</h3>}
          <fieldset disabled={save.isPending} className="min-w-0 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Label className="flex min-w-0 flex-col items-stretch gap-1">{t.query}
                <Input ref={queryInput} dir="auto" value={query} onChange={(event) => setQuery(event.target.value)}
                  required maxLength={200} />
              </Label>
              <Label className="flex min-w-0 flex-col items-stretch gap-1">{t.category}
                <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
                  <option value="">{t.choose}</option>
                  {categoryId && !active.some((category) => category.id === categoryId) &&
                    <option value={categoryId} disabled>{t.inactive}</option>}
                  {active.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </Label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={!canSave || save.isPending}>{editing ? t.save : t.add}</Button>
              {editing && <Button type="button" variant="outline" onClick={() => select(null)}>{t.cancel}</Button>}
            </div>
          </fieldset>
        </form>
      )}
      {save.isPending && <p role="status">{t.saving}</p>}
      {notice && <p role="status">{notice}</p>}
      {save.isError && <p role="alert">{saveConflict ? t.conflict : apiErrorMessage(save.error, lang)}</p>}
      {saveConflict && (
        <Button type="button" variant="outline" onClick={() => {
          void keywords.refetch();
          void categories.refetch();
        }}>{t.retry}</Button>
      )}
    </section>
  );
}
