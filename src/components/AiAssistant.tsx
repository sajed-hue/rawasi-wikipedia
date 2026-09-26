import { MessageCircle, Send, X } from "lucide-react";
import { useState } from "react";

import { useLanguage } from "@/lib/i18n";

export function AiAssistant() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 end-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-3xl border border-[color-mix(in_oklab,var(--gold)_50%,transparent)] bg-card shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <h4 className="text-sm font-bold">{t("ai.title")}</h4>
            <button onClick={() => setOpen(false)} aria-label="close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid h-52 place-items-center px-6 text-center text-sm text-muted-foreground">
            {t("ai.subtitle")}
          </div>
          <div className="flex items-center gap-2 border-t border-border p-3">
            <input
              disabled
              placeholder={t("ai.placeholder")}
              className="min-w-0 flex-1 rounded-full bg-background px-4 py-2 text-sm outline-none"
            />
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Send className="h-4 w-4 rtl:-scale-x-100" />
            </span>
          </div>
        </div>
      )}

      <button
        aria-label={t("ai.open")}
        onClick={() => setOpen((v) => !v)}
        className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-soft)] ring-2 ring-[color-mix(in_oklab,var(--gold)_60%,transparent)] transition-transform hover:scale-105"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
