import { createFileRoute, Link } from "@tanstack/react-router";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type SyntheticEvent } from "react";

import { AccessNotice } from "@/components/AccessNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createArticle,
  getMyArticleById,
  submitArticle,
  updateArticle,
  type Article,
  type NewArticleInput,
} from "@/data/articles";
import { categories, categoryLabel } from "@/data/categories";
import { useLanguage } from "@/lib/i18n";
import { useMockAuth } from "@/lib/mock-auth";

/**
 * Add / edit article page (/contribute). Logged-in users only.
 * - /contribute            -> add a new article
 * - /contribute?edit=<id>  -> edit a rejected article and send it again
 * Submitting sends the article for admin review (status 1).
 * The article can have one optional image (also used as its card image).
 */
export const Route = createFileRoute("/contribute")({
  validateSearch: (search: Record<string, unknown>): { edit?: string | undefined } => {
    const edit = search["edit"];
    return { edit: typeof edit === "string" ? edit : undefined };
  },
  component: ContributePage,
});

// Image rules from the backend guide: JPG, PNG or WebP, up to 5 MB.
const MAX_IMAGE_MB = 5;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * resizeImage: shrinks a chosen image to at most 1000px wide and returns it as
 * a small text string (data URL), so the browser's storage doesn't fill up.
 */
function resizeImage(file: File, maxWidth = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

const copy = {
  ar: {
    title: "أضف مقالًا جديدًا",
    subtitle: "شارك معرفتك بالتراث الفلسطيني. سيراجع المشرف مقالك قبل نشره.",
    editTitle: "تعديل المقال",
    editSubtitle: "عدّل مقالك ثم أعد إرساله للمراجعة.",
    articleTitle: "عنوان المقال",
    category: "التصنيف",
    categoryPlaceholder: "اختر تصنيفًا",
    categoryError: "الرجاء اختيار تصنيف",
    summary: "ملخص قصير",
    content: "نص المقال",
    image: "صورة المقال (اختيارية)",
    imageChoose: "اضغط لاختيار صورة",
    imageHint: "JPG أو PNG أو WebP، حتى 5 ميغابايت",
    imageNote: "ستظهر هذه الصورة على بطاقة المقال وفي صفحته.",
    imageRemove: "إزالة الصورة",
    imageTypeError: "الرجاء اختيار صورة بصيغة JPG أو PNG أو WebP",
    imageSizeError: "حجم الصورة أكبر من 5 ميغابايت",
    submit: "إرسال للمراجعة",
    resubmit: "حفظ وإعادة الإرسال للمراجعة",
    sending: "جارٍ الإرسال...",
    submitError: "تعذّر إرسال المقال. حاول مرة أخرى.",
    doneTitle: "تم إرسال مقالك للمراجعة",
    doneText: "سيظهر في الموقع بعد موافقة المشرف.",
    editDoneTitle: "تم إرسال تعديلاتك للمراجعة",
    editDoneText: "سيراجع المشرف المقال من جديد قبل نشره.",
    another: "إضافة مقال آخر",
    mine: "الانتقال إلى مشاركاتي",
    loading: "جارٍ التحميل...",
    notFound: "لم نجد هذا المقال",
    cannotEdit: "لا يمكن تعديل هذا المقال الآن لأنه قيد المراجعة أو منشور.",
  },
  en: {
    title: "Add a new article",
    subtitle: "Share your knowledge of Palestinian heritage. An admin reviews it before it goes live.",
    editTitle: "Edit article",
    editSubtitle: "Edit your article, then send it for review again.",
    articleTitle: "Article title",
    category: "Category",
    categoryPlaceholder: "Choose a category",
    categoryError: "Please choose a category",
    summary: "Short summary",
    content: "Article text",
    image: "Article image (optional)",
    imageChoose: "Click to choose an image",
    imageHint: "JPG, PNG or WebP, up to 5 MB",
    imageNote: "This image appears on the article's card and on its page.",
    imageRemove: "Remove image",
    imageTypeError: "Please choose a JPG, PNG or WebP image",
    imageSizeError: "The image is larger than 5 MB",
    submit: "Submit for review",
    resubmit: "Save and resubmit for review",
    sending: "Sending...",
    submitError: "Could not send the article. Please try again.",
    doneTitle: "Your article was sent for review",
    doneText: "It will appear on the site once an admin approves it.",
    editDoneTitle: "Your changes were sent for review",
    editDoneText: "An admin will review the article again before it goes live.",
    another: "Add another article",
    mine: "Go to my contributions",
    loading: "Loading...",
    notFound: "We couldn't find this article",
    cannotEdit: "This article can't be edited now because it is under review or published.",
  },
};

function ContributePage() {
  const { lang } = useLanguage();
  const t = copy[lang];
  const { isLoggedIn, isReady } = useMockAuth();
  const { edit } = Route.useSearch();

  // The article being edited. undefined = still loading, null = none / not found.
  const [existing, setExisting] = useState<Article | null | undefined>(edit ? undefined : null);
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageError, setImageError] = useState("");
  const [showCategoryError, setShowCategoryError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  // In edit mode, load the article and pre-fill its category and image.
  useEffect(() => {
    if (!edit) {
      setExisting(null);
      return;
    }
    getMyArticleById(edit).then((a) => {
      setExisting(a);
      if (a) {
        setCategoryId(a.categoryId);
        setImageUrl(a.imageUrl);
      }
    });
  }, [edit]);

  /**
   * handleImageChange: runs when the user picks an image file.
   * Checks the type and size, shrinks the image, and keeps it for the preview.
   */
  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setImageError(t.imageTypeError);
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setImageError(t.imageSizeError);
      return;
    }
    try {
      setImageUrl(await resizeImage(file));
      setImageError("");
    } catch {
      setImageError(t.imageTypeError);
    }
  }

  /**
   * handleSubmit: runs when the form is submitted.
   * 1. Checks a category was chosen and reads the typed fields.
   * 2. New article: creates it, then submits it for review.
   *    Edit mode: saves the changes (and the image, or its removal),
   *    then submits it for review again.
   * 3. Shows the success message, or an error if something failed.
   */
  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!categoryId) {
      setShowCategoryError(true);
      return;
    }
    const form = new FormData(event.currentTarget);
    const input: NewArticleInput = {
      title: String(form.get("title") ?? "").trim(),
      summary: String(form.get("summary") ?? "").trim(),
      content: String(form.get("content") ?? "").trim(),
      categoryId,
      // Edit mode: "" means "remove the image". New article: only set if chosen.
      ...(existing ? { imageUrl: imageUrl ?? "" } : imageUrl ? { imageUrl } : {}),
    };
    setSaving(true);
    setSubmitError("");
    try {
      if (existing) {
        await updateArticle(existing.id, input);
        await submitArticle(existing.id);
      } else {
        const created = await createArticle(input);
        await submitArticle(created.id);
      }
      setDone(true);
    } catch (error) {
      console.error("Submit failed:", error);
      setSubmitError(t.submitError);
    } finally {
      setSaving(false); // always runs, so the button never stays stuck
    }
  }

  // Guards go AFTER all hooks above (React requires hooks to run every time).
  if (!isReady) return null;
  if (!isLoggedIn) return <AccessNotice />;

  const backToMine = (
    <Button asChild variant="outline">
      <Link to="/my-contributions">{t.mine}</Link>
    </Button>
  );

  if (edit && existing === undefined) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">{t.loading}</div>;
  }

  if (edit && (existing === null || (existing && ![0, 3].includes(existing.status)))) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">{existing === null ? t.notFound : t.cannotEdit}</p>
        <div className="mt-6">{backToMine}</div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-2xl text-primary">{existing ? t.editDoneTitle : t.doneTitle}</h1>
        <p className="mt-3 text-muted-foreground">{existing ? t.editDoneText : t.doneText}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {!existing && (
            <Button
              onClick={() => {
                setDone(false);
                setCategoryId("");
                setImageUrl(undefined);
              }}
            >
              {t.another}
            </Button>
          )}
          {backToMine}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <header className="text-center">
        <h1 className="font-display text-3xl text-primary sm:text-4xl">{existing ? t.editTitle : t.title}</h1>
        <p className="mt-3 text-muted-foreground">{existing ? t.editSubtitle : t.subtitle}</p>
      </header>

      <form
        key={existing?.id ?? "new"}
        onSubmit={handleSubmit}
        className="mt-8 space-y-5 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8"
      >
        <div className="space-y-2">
          <Label htmlFor="article-title">{t.articleTitle}</Label>
          <Input
            id="article-title"
            name="title"
            required
            minLength={3}
            defaultValue={existing?.title ?? ""}
            className="h-11 bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label>{t.category}</Label>
          <Select
            value={categoryId}
            onValueChange={(v) => {
              setCategoryId(v);
              setShowCategoryError(false);
            }}
          >
            <SelectTrigger className="h-11 bg-background">
              <SelectValue placeholder={t.categoryPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {categoryLabel(c, lang)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showCategoryError && <p className="text-sm text-destructive">{t.categoryError}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="article-summary">{t.summary}</Label>
          <Textarea
            id="article-summary"
            name="summary"
            required
            minLength={10}
            rows={3}
            defaultValue={existing?.summary ?? ""}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="article-content">{t.content}</Label>
          <Textarea
            id="article-content"
            name="content"
            required
            minLength={30}
            rows={10}
            defaultValue={existing?.content ?? ""}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="article-image">{t.image}</Label>
          {imageUrl ? (
            <div className="relative overflow-hidden rounded-2xl border border-border">
              <img src={imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl(undefined)}
                aria-label={t.imageRemove}
                title={t.imageRemove}
                className="absolute end-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-primary shadow hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="article-image"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ImagePlus className="h-8 w-8" />
              {t.imageChoose}
              <span className="text-xs">{t.imageHint}</span>
            </label>
          )}
          <input
            key={imageUrl ? "has-image" : "no-image"}
            id="article-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="sr-only"
          />
          <p className="text-xs text-muted-foreground">{t.imageNote}</p>
          {imageError && <p className="text-sm text-destructive">{imageError}</p>}
        </div>

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <Button type="submit" disabled={saving} className="h-11 w-full">
          {saving ? t.sending : existing ? t.resubmit : t.submit}
        </Button>
      </form>
    </div>
  );
}