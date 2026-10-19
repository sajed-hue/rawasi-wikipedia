// Maps Firebase Auth error codes to friendly, localized messages (AR/EN).

type Lang = "ar" | "en";

function codeOf(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  return "";
}

const MESSAGES: Record<Lang, Record<string, string>> = {
  ar: {
    "auth/invalid-email": "البريد الإلكتروني غير صالح.",
    "auth/user-disabled": "هذا الحساب معطّل. تواصل مع الإدارة.",
    "auth/user-not-found": "لا يوجد حساب بهذا البريد.",
    "auth/wrong-password": "كلمة المرور غير صحيحة.",
    "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    "auth/email-already-in-use": "هذا البريد مستخدم بالفعل. سجّل الدخول بدلاً من ذلك.",
    "auth/weak-password": "كلمة المرور ضعيفة (8 أحرف على الأقل).",
    "auth/too-many-requests": "محاولات كثيرة جداً. حاول لاحقاً.",
    "auth/network-request-failed": "تعذّر الاتصال. تحقّق من الإنترنت وحاول مجدداً.",
    "auth/operation-not-allowed": "طريقة تسجيل الدخول هذه غير مفعّلة.",
  },
  en: {
    "auth/invalid-email": "Invalid email address.",
    "auth/user-disabled": "This account is disabled. Contact an admin.",
    "auth/user-not-found": "No account found for this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/email-already-in-use": "This email is already in use. Try signing in instead.",
    "auth/weak-password": "Password is too weak (at least 8 characters).",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your connection and retry.",
    "auth/operation-not-allowed": "This sign-in method is not enabled.",
  },
};

export function firebaseAuthErrorMessage(error: unknown, lang: Lang): string {
  const table = MESSAGES[lang];
  const message = table[codeOf(error)];
  if (message) return message;
  return lang === "en"
    ? "Something went wrong. Please try again."
    : "حدث خطأ غير متوقع. حاول مرة أخرى.";
}
