// Localized, user-facing messages for ApiError kinds (AR/EN).
// Components show these instead of raw backend text; validation field errors
// are surfaced next to their inputs via ApiError.fieldErrors.

import { isApiError, type ApiErrorKind } from "./problem";

type Lang = "ar" | "en";

const MESSAGES: Record<Lang, Record<ApiErrorKind, string>> = {
  ar: {
    validation: "تحقّق من الحقول المطلوبة وحاول مرة أخرى.",
    authentication: "انتهت جلستك. سجّل الدخول من جديد.",
    authorization: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
    notFound: "هذا العنصر غير موجود أو غير متاح.",
    conflict: "لا يمكن تنفيذ هذا الإجراء في حالة المقال الحالية. حدّث الصفحة وحاول مجدداً.",
    payloadTooLarge: "الملف كبير جداً. الحد الأقصى 5 ميغابايت.",
    rateLimit: "طلبات كثيرة خلال وقت قصير. انتظر قليلاً ثم حاول.",
    server: "حدث خطأ في الخادم. حاول لاحقاً.",
    network: "تعذّر الاتصال بالخادم. تحقّق من اتصالك.",
    canceled: "تم إلغاء العملية.",
    unknown: "حدث خطأ غير متوقع. حاول مرة أخرى.",
  },
  en: {
    validation: "Check the required fields and try again.",
    authentication: "Your session expired. Please sign in again.",
    authorization: "You don't have permission to do this.",
    notFound: "This item doesn't exist or isn't available.",
    conflict: "This action isn't allowed in the article's current state. Refresh and try again.",
    payloadTooLarge: "The file is too large. The limit is 5 MB.",
    rateLimit: "Too many requests. Please wait a moment and retry.",
    server: "A server error occurred. Please try later.",
    network: "Couldn't reach the server. Check your connection.",
    canceled: "The operation was canceled.",
    unknown: "Something went wrong. Please try again.",
  },
};

/** Friendly message for any thrown value; appends the support id on server errors. */
export function apiErrorMessage(error: unknown, lang: Lang): string {
  if (!isApiError(error)) return MESSAGES[lang].unknown;
  const base = MESSAGES[lang][error.kind];
  if (error.kind === "server" && error.traceId) {
    return `${base} (${lang === "ar" ? "رمز الدعم" : "Support ID"}: ${error.traceId})`;
  }
  return base;
}

/** First validation message for a backend field name (e.g. "Title"), if any. */
export function fieldError(error: unknown, field: string): string | undefined {
  return isApiError(error) ? error.firstFieldError(field) : undefined;
}
