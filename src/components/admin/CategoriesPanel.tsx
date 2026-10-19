import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Pencil, Plus } from "lucide-react";
import { useState, type SyntheticEvent } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { activateCategory, createCategory, deactivateCategory, updateCategory } from "@/lib/api/admin";
import { useAdminCategories, useInvalidateAdmin } from "@/lib/api/admin-queries";
import { apiErrorMessage, fieldError } from "@/lib/api/messages";
import type { CategoryAdminDto } from "@/lib/api/types";
import { useLanguage } from "@/lib/i18n";
import { NoticeBar, QueryState, type Notice } from "./shared";

const LIMITS = { name: 100, description: 500 } as const;

const copy = {
  ar: {
    intro: "التصنيفات المعطّلة تختفي من الموقع مع مقالاتها، ويمكن إعادة تفعيلها في أي وقت.",
    groupNote: "التصنيفات الجديدة التي لا تطابق القائمة الأساسية تظهر ضمن «التراث غير المادي» في صفحة الاستكشاف.",
    add: "إضافة تصنيف",
    empty: "لا توجد تصنيفات بعد.",
    active: "مفعّل",
    inactive: "معطّل",
    edit: "تعديل",
    activate: "تفعيل",
    deactivate: "تعطيل",
    createTitle: "تصنيف جديد",
    editTitle: "تعديل التصنيف",
    name: "الاسم",
    description: "الوصف",
    save: "حفظ",
    saving: "جارٍ الحفظ...",
    cancel: "إلغاء",
    created: "تمت إضافة التصنيف.",
    updated: "تم حفظ التعديلات.",
    activated: "تم تفعيل التصنيف.",
    deactivated: "تم تعطيل التصنيف.",
    confirmTitle: "تعطيل التصنيف؟",
    confirmText: "سيختفي هذا التصنيف وكل مقالاته من الموقع حتى تعيد تفعيله.",
    confirm: "نعم، عطّل",
  },
  en: {
    intro: "Deactivated categories disappear from the site along with their articles, and can be reactivated any time.",
    groupNote: "New categories that don't match the base list appear under “Intangible heritage” on Explore.",
    add: "Add category",
    empty: "No categories yet.",
    active: "Active",
    inactive: "Inactive",
    edit: "Edit",
    activate: "Activate",
    deactivate: "Deactivate",
    createTitle: "New category",
    editTitle: "Edit category",
    name: "Name",
    description: "Description",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    created: "Category added.",
    updated: "Changes saved.",
    activated: "Category activated.",
    deactivated: "Category deactivated.",
    confirmTitle: "Deactivate this category?",
    confirmText: "This category and all its articles will disappear from the site until you reactivate it.",
    confirm: "Yes, deactivate",
  },
};

type Editing = { mode: "create" } | { mode: "edit"; category: CategoryAdminDto } | null;

export function CategoriesPanel({ enabled }: { enabled: boolean }) {
  const { lang, dir } = useLanguage();
  const t = copy[lang];
  const categories = useAdminCategories(enabled);
  const invalidate = useInvalidateAdmin();

  const [notice, setNotice] = useState<Notice>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [formError, setFormError] = useState<unknown>(null);
  const [confirming, setConfirming] = useState<CategoryAdminDto | null>(null);

  const save = useMutation({
    mutationFn: async (args: { editing: NonNullable<Editing>; name: string; description: string }) => {
      const body = { name: args.name, description: args.description };
      if (args.editing.mode === "create") await createCategory(body);
      else await updateCategory(args.editing.category.id, body);
    },
  });
  const toggle = useMutation({
    mutationFn: (c: CategoryAdminDto) => (c.isActive ? deactivateCategory(c.id) : activateCategory(c.id)),
  });

  async function handleSave(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    setFormError(null);
    try {
      await save.mutateAsync({
        editing,
        name: String(form.get("name") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
      });
      setNotice({ kind: "ok", text: editing.mode === "create" ? t.created : t.updated });
      setEditing(null);
      await invalidate("categories");
    } catch (error) {
      setFormError(error); // keep the dialog open with the typed values
    }
  }

  async function handleToggle(category: CategoryAdminDto) {
    setNotice(null);
    setConfirming(null);
    try {
      await toggle.mutateAsync(category);
      setNotice({ kind: "ok", text: category.isActive ? t.deactivated : t.activated });
    } catch (error) {
      setNotice({ kind: "error", text: apiErrorMessage(error, lang) });
    } finally {
      await invalidate("categories");
    }
  }

  const current = editing?.mode === "edit" ? editing.category : null;

  return (
    <div dir={dir}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{t.intro}</p>
          <p className="text-xs">{t.groupNote}</p>
        </div>
        <Button className="shrink-0 rounded-full" onClick={() => { setFormError(null); setEditing({ mode: "create" }); }}>
          <Plus />
          {t.add}
        </Button>
      </div>

      <div className="mt-6"><NoticeBar notice={notice} /></div>

      <QueryState isLoading={categories.isLoading} isError={categories.isError} onRetry={() => void categories.refetch()} lang={lang} />

      {categories.data && categories.data.length === 0 && (
        <p className="mt-6 rounded-3xl border border-dashed border-border bg-card py-16 text-center text-muted-foreground">{t.empty}</p>
      )}

      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {categories.data?.map((c) => (
          <li key={c.id} className={`flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] ${c.isActive ? "" : "opacity-75"}`}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg text-foreground">{c.name}</h3>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${c.isActive ? "bg-secondary text-primary" : "bg-muted text-muted-foreground"}`}>
                {c.isActive ? t.active : t.inactive}
              </span>
            </div>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setFormError(null); setEditing({ mode: "edit", category: c }); }}>
                <Pencil />
                {t.edit}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`rounded-full ${c.isActive ? "text-destructive" : ""}`}
                disabled={toggle.isPending}
                onClick={() => (c.isActive ? setConfirming(c) : void handleToggle(c))}
              >
                {c.isActive ? <EyeOff /> : <Eye />}
                {c.isActive ? t.deactivate : t.activate}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent dir={dir} className="w-[calc(100%-2rem)] rounded-2xl">
          <DialogTitle className="text-start font-display text-primary">{current ? t.editTitle : t.createTitle}</DialogTitle>
          <DialogDescription className="sr-only">{current ? t.editTitle : t.createTitle}</DialogDescription>
          <form key={current?.id ?? "new"} onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">{t.name}</Label>
              <Input id="category-name" name="name" required maxLength={LIMITS.name} defaultValue={current?.name ?? ""} className="h-11 bg-background" />
              {fieldError(formError, "Name") && <p className="text-sm text-destructive">{fieldError(formError, "Name")}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">{t.description}</Label>
              <Textarea id="category-description" name="description" maxLength={LIMITS.description} rows={3} defaultValue={current?.description ?? ""} className="bg-background" />
              {fieldError(formError, "Description") && <p className="text-sm text-destructive">{fieldError(formError, "Description")}</p>}
            </div>
            {formError !== null && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{apiErrorMessage(formError, lang)}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>{t.cancel}</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? t.saving : t.save}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent dir={dir} className="w-[calc(100%-2rem)] rounded-2xl">
          <DialogTitle className="text-start font-display text-primary">{t.confirmTitle}</DialogTitle>
          <DialogDescription className="text-start">{confirming ? `${confirming.name} — ${t.confirmText}` : ""}</DialogDescription>
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
