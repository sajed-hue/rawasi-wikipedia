import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type Lang = "ar" | "en";

/** Localized date (optionally with time) from an ISO string; "—" when missing. */
export function formatDate(iso: string | null | undefined, lang: Lang, withTime = false): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(lang === "ar" ? "ar" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** First 8 characters of a GUID, for compact display. */
export function shortId(id: string | null | undefined): string {
  return id ? id.slice(0, 8) : "—";
}

export type Notice = { kind: "ok" | "error"; text: string } | null;

export function NoticeBar({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
    <p
      role={notice.kind === "error" ? "alert" : "status"}
      className={`rounded-2xl px-4 py-3 text-sm ${notice.kind === "error" ? "bg-destructive/10 text-destructive" : "border border-border bg-secondary text-primary"}`}
    >
      {notice.text}
    </p>
  );
}

const pagerCopy = {
  ar: { prev: "السابق", next: "التالي", of: "من" },
  en: { prev: "Previous", next: "Next", of: "of" },
};

/** Previous / next pager; hidden when there is a single page. */
export function Pager({ page, totalPages, onPage, lang }: { page: number; totalPages: number; onPage: (page: number) => void; lang: Lang }) {
  if (totalPages <= 1) return null;
  const t = pagerCopy[lang];
  const Prev = lang === "ar" ? ChevronRight : ChevronLeft;
  const Next = lang === "ar" ? ChevronLeft : ChevronRight;
  return (
    <nav aria-label="pagination" className="mt-8 flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" className="rounded-full" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <Prev />
        {t.prev}
      </Button>
      <span className="text-sm tabular-nums text-muted-foreground">
        {page} {t.of} {totalPages}
      </span>
      <Button variant="outline" size="sm" className="rounded-full" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        {t.next}
        <Next />
      </Button>
    </nav>
  );
}

const stateCopy = {
  ar: { loading: "جارٍ التحميل...", error: "تعذّر تحميل البيانات.", retry: "إعادة المحاولة" },
  en: { loading: "Loading...", error: "We couldn't load the data.", retry: "Try again" },
};

/** Loading / error placeholder for a panel's main query. */
export function QueryState({ isLoading, isError, onRetry, lang }: { isLoading: boolean; isError: boolean; onRetry: () => void; lang: Lang }) {
  const t = stateCopy[lang];
  if (isLoading) return <p className="py-16 text-center text-muted-foreground" aria-busy="true">{t.loading}</p>;
  if (!isError) return null;
  return (
    <div className="py-16 text-center">
      <p className="text-muted-foreground">{t.error}</p>
      <Button variant="outline" className="mt-4 rounded-full" onClick={onRetry}>
        <RefreshCw />
        {t.retry}
      </Button>
    </div>
  );
}
