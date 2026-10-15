import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

/**
 * AccessNotice: shown to guests instead of a members-only page
 * (My Contributions and the add-article form).
 * Offers the log in and sign up buttons.
 */
const copy = {
  ar: {
    title: "هذه الميزة للأعضاء المسجّلين",
    text: "سجّل الدخول أو أنشئ حسابًا لتتمكن من إضافة مشاركاتك ومتابعتها.",
    loginBtn: "تسجيل الدخول",
    signupBtn: "إنشاء حساب",
  },
  en: {
    title: "This feature is for registered users",
    text: "Log in or create an account to add your contributions and follow them.",
    loginBtn: "Log in",
    signupBtn: "Create account",
  },
};

export function AccessNotice() {
  const { lang, dir } = useLanguage();
  const t = copy[lang];

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center" dir={dir}>
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary text-primary">
        <Lock className="h-8 w-8" />
      </span>
      <h1 className="mt-6 font-display text-2xl text-primary">{t.title}</h1>
      <p className="mt-3 text-muted-foreground">{t.text}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild className="rounded-full px-6">
          <Link to="/login">{t.loginBtn}</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full px-6">
          <Link to="/signup">{t.signupBtn}</Link>
        </Button>
      </div>
    </div>
  );
}