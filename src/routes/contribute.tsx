import { createFileRoute, Link } from "@tanstack/react-router";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type SyntheticEvent } from "react";

import { AccessNotice } from "@/components/AccessNotice";
import { AuthImage } from "@/components/AuthImage";
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
import { categoryLabel } from "@/data/categories";
import { IMAGE_RULES, deletePostMedia, pickPrimaryMedia, uploadPostMedia, validateImageFile } from "@/lib/api/media";
import { apiErrorMessage, fieldError } from "@/lib/api/messages";
import { shrinkImage } from "@/lib/image-resize";
import { createDraft, createRevision, submitPost, updateDraft } from "@/lib/api/posts";
import { isApiError } from "@/lib/api/problem";
import { useCategoryIndex, useInvalidatePosts, usePostMedia, usePublicPost } from "@/lib/api/queries";
import { useLanguage } from "@/lib/i18n";
import { useMockAuth } from "@/lib/mock-auth";

/**
 * Add / edit article page (/contribute). Logged-in users only.
 * - /contribute            -> new article: create draft -> upload image -> submit
 * - /contribute?edit=<id>  -> Draft/Rejected: edit then resubmit
 *                            Approved: propose a revision (admin reviews it)
 *                            Pending/Archived: not editable
 */
export const Route = createFileRoute("/contribute")({
  validateSearch: (search: Record<string, unknown>): { edit?: string | undefined } => {
    const edit = search["edit"];
    return { edit: typeof edit === "string" ? edit : undefined };
  },
  component: ContributePage,
});

// Backend validation limits (FluentValidation in the API).
const LIMITS = { title: 200, summary: 500, content: 50000, changeDescription: 1000 } as const;
/** Largest photo accepted before in-browser shrinking (the upload itself must be ≤ 5 MB). */
const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;

const copy = {
  ar: {
    title: "أضف مقالًا جديدًا",
    subtitle: "شارك معرفتك بالتراث الفلسطيني. سيراجع المشرف مقالك قبل نشره.",
    editTitle: "تعديل المقال",
    editSubtitle: "عدّل مقالك ثم أعد إرساله للمراجعة.",
    reviseTitle: "اقتراح تعديل على مقال منشور",
    reviseSubtitle: "يبقى المقال المنشور كما هو حتى يوافق المشرف على تعديلك.",
    articleTitle: "عنوان المقال",
    category: "التصنيف",
    categoryPlaceholder: "اختر تصنيفًا",
    categoryError: "الرجاء اختيار تصنيف",
    summary: "ملخص قصير",
    content: "نص المقال",
    changeDescription: "ما الذي غيّرته؟",
    changeDescriptionHint: "صف تعديلك باختصار ليفهمه المشرف (مثلاً: تصحيح تاريخ، إضافة فقرة).",
    reviseImageNote: "الصور لا تتغيّر عبر اقتراح التعديل.",
    image: "صورة المقال (اختيارية)",
    imageChoose: "اضغط لاختيار صورة",
    imageHint: "JPG أو PNG أو WebP، حتى 20 ميغابايت (تُصغَّر الصور الكبيرة تلقائياً)",
    preparingImage: "جارٍ تجهيز الصورة...",
    imageNote: "ستظهر هذه الصورة على بطاقة المقال وفي صفحته.",
    imageRemove: "إزالة الصورة",
    imageTypeError: "الرجاء اختيار صورة بصيغة JPG أو PNG أو WebP",
    imageSizeError: "الصورة كبيرة جداً. اختر صورة أصغر من 20 ميغابايت.",
    submit: "إرسال للمراجعة",
    resubmit: "حفظ وإعادة الإرسال للمراجعة",
    sendRevision: "إرسال اقتراح التعديل",
    sending: "جارٍ الإرسال...",
    imageFailed: "حُفظ المقال كمسودة، لكن تعذّر رفع الصورة. يمكنك المحاولة مجدداً هنا أو إكماله من «مشاركاتي».",
    revisionPending: "لديك اقتراح تعديل على هذا المقال ما زال قيد المراجعة. انتظر قرار المشرف قبل إرسال اقتراح جديد.",
    doneTitle: "تم إرسال مقالك للمراجعة",
    doneText: "سيظهر في الموقع بعد موافقة المشرف.",
    editDoneTitle: "تم إرسال تعديلاتك للمراجعة",
    editDoneText: "سيراجع المشرف المقال من جديد قبل نشره.",
    reviseDoneTitle: "تم إرسال اقتراح التعديل",
    reviseDoneText: "سيبقى المقال المنشور كما هو حتى يوافق المشرف.",
    another: "إضافة مقال آخر",
    mine: "الانتقال إلى مشاركاتي",
    loading: "جارٍ التحميل...",
    notFound: "لم نجد هذا المقال",
    cannotEdit: "لا يمكن تعديل هذا المقال الآن لأنه قيد المراجعة أو مؤرشف.",
  },
  en: {
    title: "Add a new article",
    subtitle: "Share your knowledge of Palestinian heritage. An admin reviews it before it goes live.",
    editTitle: "Edit article",
    editSubtitle: "Edit your article, then send it for review again.",
    reviseTitle: "Propose an edit to a published article",
    reviseSubtitle: "The published article stays unchanged until an admin approves your edit.",
    articleTitle: "Article title",
    category: "Category",
    categoryPlaceholder: "Choose a category",
    categoryError: "Please choose a category",
    summary: "Short summary",
    content: "Article text",
    changeDescription: "What did you change?",
    changeDescriptionHint: "Briefly describe your edit for the admin (e.g. fixed a date, added a paragraph).",
    reviseImageNote: "Images can't be changed through a proposed edit.",
    image: "Article image (optional)",
    imageChoose: "Click to choose an image",
    imageHint: "JPG, PNG or WebP, up to 20 MB (large photos are shrunk automatically)",
    preparingImage: "Preparing image...",
    imageNote: "This image appears on the article's card and on its page.",
    imageRemove: "Remove image",
    imageTypeError: "Please choose a JPG, PNG or WebP image",
    imageSizeError: "That image is too large. Choose one under 20 MB.",
    submit: "Submit for review",
    resubmit: "Save and resubmit for review",
    sendRevision: "Send proposed edit",
    sending: "Sending...",
    imageFailed: "The article was saved as a draft, but the image upload failed. Retry here or finish it from “My contributions”.",
    revisionPending: "You already have a proposed edit on this article under review. Wait for the admin's decision before proposing another.",
    doneTitle: "Your article was sent for review",
    doneText: "It will appear on the site once an admin approves it.",
    editDoneTitle: "Your changes were sent for review",
    editDoneText: "An admin will review the article again before it goes live.",
    reviseDoneTitle: "Your proposed edit was sent",
    reviseDoneText: "The published article stays as it is until an admin approves.",
    another: "Add another article",
    mine: "Go to my contributions",
    loading: "Loading...",
    notFound: "We couldn't find this article",
    cannotEdit: "This article can't be edited now because it is under review or archived.",
  },
};

type Mode = "new" | "loading" | "edit" | "revise" | "blocked" | "notFound";

function ContributePage() {
  const { lang } = useLanguage();
  const t = copy[lang];
  const { isLoggedIn, isReady } = useMockAuth();
  const { edit } = Route.useSearch();
  const invalidate = useInvalidatePosts();
  const { index: catIndex } = useCategoryIndex();

  // In edit mode, load the post (owner can read their own unpublished post) and its media.
  const postQuery = usePublicPost(edit ?? "", Boolean(edit) && isLoggedIn);
  const mediaQuery = usePostMedia(edit ?? "", Boolean(edit) && isLoggedIn);
  const existing = edit ? postQuery.data : undefined;
  const existingPrimary = mediaQuery.data ? pickPrimaryMedia(mediaQuery.data) : undefined;

  const [categoryId, setCategoryId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [imageError, setImageError] = useState("");
  const [preparingImage, setPreparingImage] = useState(false);
  const [showCategoryError, setShowCategoryError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [errorText, setErrorText] = useState("");
  // Id of a draft created in this session, so a retry updates it instead of creating a duplicate.
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const mode: Mode = !edit
    ? "new"
    : postQuery.isError
      ? "notFound"
      : !existing
        ? "loading"
        : existing.status === 2
          ? "revise"
          : existing.status === 0 || existing.status === 3
            ? "edit"
            : "blocked";

  // Pre-fill the category once the post being edited has loaded.
  useEffect(() => {
    if (existing) setCategoryId(existing.categoryId);
  }, [existing]);

  // Local preview of a newly chosen file; the object URL is revoked when it changes.
  useEffect(() => {
    if (!imageFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  /**
   * handleImageChange: checks the type, shrinks large photos in the browser, then
   * checks the final size (UX only — the backend re-validates everything).
   * Accepting up to 20 MB here lets phone photos through; they end up well under 5 MB.
   */
  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!(IMAGE_RULES.types as readonly string[]).includes(file.type)) {
      setImageError(t.imageTypeError);
      return;
    }
    if (file.size > MAX_SOURCE_IMAGE_BYTES) {
      setImageError(t.imageSizeError);
      return;
    }
    setImageError("");
    setPreparingImage(true);
    try {
      const prepared = await shrinkImage(file);
      const problem = validateImageFile(prepared);
      if (problem) {
        setImageError(problem === "type" ? t.imageTypeError : t.imageSizeError);
        return;
      }
      setImageFile(prepared);
    } finally {
      setPreparingImage(false);
    }
  }

  function fail(err: unknown, text?: string) {
    setError(err);
    setErrorText(text ?? apiErrorMessage(err, lang));
  }

  /**
   * handleSubmit:
   * - revise: POST /revisions (the approved post stays live until approved).
   * - new/edit: create or update the draft, replace the image if requested,
   *   then submit for review. Buttons stay disabled while this runs.
   */
  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!categoryId) {
      setShowCategoryError(true);
      return;
    }
    const form = new FormData(event.currentTarget);
    const body = {
      title: String(form.get("title") ?? "").trim(),
      summary: String(form.get("summary") ?? "").trim(),
      content: String(form.get("content") ?? "").trim(),
      categoryId,
    };

    setSaving(true);
    setError(null);
    setErrorText("");

    let postId: string | null = createdId ?? (mode === "edit" && existing ? existing.id : null);
    try {
      if (mode === "revise" && existing) {
        const changeDescription = String(form.get("changeDescription") ?? "").trim();
        await createRevision(existing.id, { ...body, changeDescription });
        await invalidate(existing.id);
        setDone(true);
        return;
      }

      if (postId) {
        await updateDraft(postId, body);
      } else {
        postId = await createDraft(body);
        setCreatedId(postId);
      }

      // Replace / remove the image while the post is still a draft.
      try {
        if (existingPrimary && (removeExisting || imageFile)) {
          await deletePostMedia(postId, existingPrimary.id);
        }
        if (imageFile) {
          await uploadPostMedia(postId, imageFile, { isPrimary: true, altText: body.title });
        }
      } catch (mediaError) {
        fail(mediaError, `${t.imageFailed} (${apiErrorMessage(mediaError, lang)})`);
        await invalidate(postId);
        return;
      }

      await submitPost(postId);
      await invalidate(postId);
      setDone(true);
    } catch (err) {
      // A post can have only one pending revision at a time (backend rule, 409).
      const pendingRevision = mode === "revise" && isApiError(err) && err.kind === "conflict";
      fail(err, pendingRevision ? t.revisionPending : undefined);
      if (postId) await invalidate(postId);
    } finally {
      setSaving(false); // always runs, so the button never stays stuck
    }
  }

  function resetForAnother() {
    setDone(false);
    setCategoryId("");
    setImageFile(null);
    setRemoveExisting(false);
    setCreatedId(null);
    setError(null);
    setErrorText("");
  }

  // Guards go AFTER all hooks above (React requires hooks to run every time).
  if (!isReady) return null;
  if (!isLoggedIn) return <AccessNotice />;

  const backToMine = (
    <Button asChild variant="outline">
      <Link to="/my-contributions">{t.mine}</Link>
    </Button>
  );

  if (mode === "loading") {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground" aria-busy="true">{t.loading}</div>;
  }

  if (mode === "notFound" || mode === "blocked") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">{mode === "notFound" ? t.notFound : t.cannotEdit}</p>
        <div className="mt-6">{backToMine}</div>
      </div>
    );
  }

  if (done) {
    const [doneTitle, doneText] =
      mode === "revise" ? [t.reviseDoneTitle, t.reviseDoneText] : mode === "edit" ? [t.editDoneTitle, t.editDoneText] : [t.doneTitle, t.doneText];
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-2xl text-primary">{doneTitle}</h1>
        <p className="mt-3 text-muted-foreground">{doneText}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {mode === "new" && <Button onClick={resetForAnother}>{t.another}</Button>}
          {backToMine}
        </div>
      </div>
    );
  }

  const heading = mode === "revise" ? t.reviseTitle : mode === "edit" ? t.editTitle : t.title;
  const subheading = mode === "revise" ? t.reviseSubtitle : mode === "edit" ? t.editSubtitle : t.subtitle;
  const submitLabel = mode === "revise" ? t.sendRevision : mode === "edit" ? t.resubmit : t.submit;
  const showExistingImage = mode === "edit" && existingPrimary && !removeExisting && !imageFile;
  const fe = (field: string) => fieldError(error, field);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <header className="text-center">
        <h1 className="font-display text-3xl text-primary sm:text-4xl">{heading}</h1>
        <p className="mt-3 text-muted-foreground">{subheading}</p>
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
            maxLength={LIMITS.title}
            defaultValue={existing?.title ?? ""}
            aria-invalid={Boolean(fe("Title"))}
            className="h-11 bg-background"
          />
          {fe("Title") && <p className="text-sm text-destructive">{fe("Title")}</p>}
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
              {catIndex.all.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {categoryLabel(c, lang)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(showCategoryError || fe("CategoryId")) && (
            <p className="text-sm text-destructive">{fe("CategoryId") ?? t.categoryError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="article-summary">{t.summary}</Label>
          <Textarea
            id="article-summary"
            name="summary"
            required
            minLength={10}
            maxLength={LIMITS.summary}
            rows={3}
            defaultValue={existing?.summary ?? ""}
            aria-invalid={Boolean(fe("Summary"))}
            className="bg-background"
          />
          {fe("Summary") && <p className="text-sm text-destructive">{fe("Summary")}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="article-content">{t.content}</Label>
          <Textarea
            id="article-content"
            name="content"
            required
            minLength={30}
            maxLength={LIMITS.content}
            rows={10}
            defaultValue={existing?.content ?? ""}
            aria-invalid={Boolean(fe("Content"))}
            className="bg-background"
          />
          {fe("Content") && <p className="text-sm text-destructive">{fe("Content")}</p>}
        </div>

        {mode === "revise" ? (
          <div className="space-y-2">
            <Label htmlFor="article-change">{t.changeDescription}</Label>
            <Textarea
              id="article-change"
              name="changeDescription"
              required
              minLength={3}
              maxLength={LIMITS.changeDescription}
              rows={3}
              aria-invalid={Boolean(fe("ChangeDescription"))}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">{t.changeDescriptionHint}</p>
            {fe("ChangeDescription") && <p className="text-sm text-destructive">{fe("ChangeDescription")}</p>}
            <p className="text-xs text-muted-foreground">{t.reviseImageNote}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="article-image">{t.image}</Label>
            {preview || showExistingImage ? (
              <div className="relative overflow-hidden rounded-2xl border border-border">
                {preview ? (
                  <img src={preview} alt="" className="aspect-[4/3] w-full object-cover" />
                ) : (
                  existing && (
                    <AuthImage
                      postId={existing.id}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                      fallback={<div className="aspect-[4/3] w-full animate-pulse bg-muted" />}
                    />
                  )
                )}
                <button
                  type="button"
                  onClick={() => (preview ? setImageFile(null) : setRemoveExisting(true))}
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
              key={imageFile ? "has-image" : "no-image"}
              id="article-image"
              type="file"
              accept={IMAGE_RULES.accept}
              onChange={(e) => void handleImageChange(e)}
              disabled={preparingImage}
              className="sr-only"
            />
            <p className="text-xs text-muted-foreground">{t.imageNote}</p>
            {preparingImage && <p role="status" className="text-sm text-primary">{t.preparingImage}</p>}
            {imageError && <p className="text-sm text-destructive">{imageError}</p>}
          </div>
        )}

        {errorText && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorText}
          </p>
        )}

        <Button type="submit" disabled={saving || preparingImage} className="h-11 w-full">
          {saving ? t.sending : submitLabel}
        </Button>
      </form>
    </div>
  );
}
