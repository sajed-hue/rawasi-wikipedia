import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";

const copy = {
  ar: {
    text: "سجّلت الدخول، لكن تعذّر الاتصال بالخادم لتحميل حسابك. سنعيد المحاولة تلقائياً.",
    retry: "إعادة المحاولة الآن",
  },
  en: {
    text: "You're signed in, but we couldn't reach the server to load your account. We'll keep retrying.",
    retry: "Retry now",
  },
};

/**
 * Shown only while the user is signed in to Firebase but the backend profile
 * failed to load (server/network error). Without it the user would just look
 * signed out, with no explanation.
 */
export function SessionNotice() {
  const { profileError, reloadProfile } = useAuth();
  const { lang, dir } = useLanguage();
  const [retrying, setRetrying] = useState(false);

  if (!profileError) return null;
  const t = copy[lang];

  async function retry() {
    setRetrying(true);
    try {
      await reloadProfile();
    } catch {
      // still failing — the notice stays and automatic retries continue
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div role="status" dir={dir} className="border-b border-border bg-secondary px-4 py-2.5 text-sm text-primary">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <span>{t.text}</span>
        <button
          type="button"
          onClick={() => void retry()}
          disabled={retrying}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 font-semibold hover:bg-card disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
          {t.retry}
        </button>
      </div>
    </div>
  );
}
