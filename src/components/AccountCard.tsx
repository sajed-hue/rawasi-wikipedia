import { Check, Pencil, User, X } from "lucide-react";
import { useState, type SyntheticEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import { useMockAuth } from "@/lib/mock-auth";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/display-name";

// Placeholder limit. The backend refuses names that are too long (error 400),
// but the guide doesn't say how long: ask the backend team for the real number.
const MAX_NAME = DISPLAY_NAME_MAX_LENGTH; // same limit as sign-up and the backend

const copy = {
  ar: {
    account: "حسابي",
    unnamed: "بدون اسم",
    emailNote: "لا يمكن تغيير البريد الإلكتروني",
    admin: "مشرف",
    member: "عضو",
    editName: "تعديل الاسم",
    nameLabel: "الاسم",
    save: "حفظ",
    cancel: "إلغاء",
    saved: "تم حفظ الاسم",
    errorShort: "الاسم مطلوب (حرفان على الأقل)",
    errorLong: `الاسم طويل جدًا (حتى ${MAX_NAME} حرفًا)`,
    errorSave: "تعذّر حفظ الاسم. حاول مرة أخرى.",
  },
  en: {
    account: "My account",
    unnamed: "No name",
    emailNote: "The email can't be changed",
    admin: "Admin",
    member: "Member",
    editName: "Edit name",
    nameLabel: "Name",
    save: "Save",
    cancel: "Cancel",
    saved: "Name saved",
    errorShort: "A name is required (at least 2 characters)",
    errorLong: `The name is too long (up to ${MAX_NAME} characters)`,
    errorSave: "Couldn't save the name. Please try again.",
  },
};

/**
 * AccountCard: shows the user's name and email, and lets them change the name.
 * Only the display name can be changed; the email and role cannot
 * (this matches the backend: PUT /api/users/me accepts only displayName).
 */
export function AccountCard() {
  const { lang, dir } = useLanguage();
  const t = copy[lang];
  const { name, email, role, updateName } = useMockAuth();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  /** startEdit: opens the name field with the current name in it. */
  function startEdit() {
    setDraft(name);
    setError("");
    setJustSaved(false);
    setEditing(true);
  }

  /** handleSave: checks the new name, saves it, and closes the field only once it's saved. */
  async function handleSave(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const value = draft.trim();
    if (value.length < 2) {
      setError(t.errorShort);
      return;
    }
    if (value.length > MAX_NAME) {
      setError(t.errorLong);
      return;
    }
    setSaving(true);
    try {
      await updateName(value);
      setEditing(false);
      setJustSaved(true);
    } catch {
      // Keep the field open with the user's text so they can retry.
      setError(t.errorSave);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      dir={dir}
      aria-label={t.account}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-center"
    >
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
        <User className="h-7 w-7" />
      </span>

      <div className="min-w-0 flex-1">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-2">
            <label htmlFor="account-name" className="text-sm font-medium text-foreground">
              {t.nameLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="account-name"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setError("");
                }}
                maxLength={MAX_NAME + 20}
                autoFocus
                className="h-10 max-w-xs bg-background"
              />
              <Button type="submit" size="sm" disabled={saving} className="h-10 rounded-full px-4">
                <Check />
                {t.save}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)} className="h-10 rounded-full px-4">
                <X />
                {t.cancel}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-display text-xl text-primary">{name || t.unnamed}</p>
              <span className="rounded-full bg-secondary px-3 py-0.5 text-xs font-semibold text-secondary-foreground">
                {role === "admin" ? t.admin : t.member}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground" dir="ltr" title={t.emailNote}>
              {email || "—"}
            </p>
            {justSaved && (
              <p role="status" className="mt-1 text-sm text-primary">
                {t.saved}
              </p>
            )}
          </>
        )}
      </div>

      {!editing && (
        <Button variant="outline" size="sm" onClick={startEdit} className="self-start rounded-full sm:self-auto">
          <Pencil />
          {t.editName}
        </Button>
      )}
    </section>
  );
}