import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState, type SyntheticEvent } from "react";

import logo from "@/assets/logo.png";
import sign_in_photo from "@/assets/sign_in_photo.png";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { firebaseAuthErrorMessage } from "@/lib/firebase-errors";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | رواسي" },
      { name: "description", content: "سجّل دخولك إلى منصة رواسي للتراث الفلسطيني." },
      { property: "og:title", content: "تسجيل الدخول | رواسي" },
      { property: "og:description", content: "الدخول إلى حسابك على رواسي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const copy = {
  ar: {
    heading: "أهلاً بعودتك إلى رواسي",
    subheading: "سجل دخولك واكتشف حكايات تراثنا",
    email: "البريد الألكتروني",
    emailPlaceholder: "أدخل بريدك الإلكتروني",
    password: "كلمة المرور",
    passwordPlaceholder: "أدخل كلمة المرور",
    remember: "تذكرني",
    forgot: "نسيت كلمة المرور؟",
    submit: "تسجيل الدخول",
    submitting: "جارٍ تسجيل الدخول...",
    noAccount: "ليس لديك حساب؟",
    signup: "إنشاء حساب",
    or: "أو",
    guest: "المتابعة كزائر",
    imageAlt: "قوس حجري تراثي فلسطيني",
    enterEmailFirst: "أدخل بريدك الإلكتروني أولاً ثم اضغط «نسيت كلمة المرور».",
    resetSent: "أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك.",
  },
  en: {
    heading: "Welcome back to Rawasi",
    subheading: "Sign in and discover the stories of our heritage",
    email: "Email",
    emailPlaceholder: "Enter your email",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    remember: "Remember me",
    forgot: "Forgot password?",
    submit: "Log in",
    submitting: "Signing in...",
    noAccount: "Don't have an account?",
    signup: "Create account",
    or: "Or",
    guest: "Continue as guest",
    imageAlt: "Traditional Palestinian stone arch",
    enterEmailFirst: "Enter your email first, then tap “Forgot password”.",
    resetSent: "We've sent a password reset link to your email.",
  },
} as const;

function LoginPage() {
  const { lang, dir } = useLanguage();
  const text = copy[lang];
  const navigate = useNavigate();
  const { signInWithEmail, sendPasswordReset } = useAuth();

  const emailRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleLogin(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
      // The backend assigns the role; the UI only reads it. Go home on success.
      navigate({ to: "/" });
    } catch (err) {
      setError(firebaseAuthErrorMessage(err, lang));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgot() {
    setError(null);
    setInfo(null);
    const email = emailRef.current?.value.trim() ?? "";
    if (!email) {
      setError(text.enterEmailFirst);
      return;
    }
    try {
      await sendPasswordReset(email);
      setInfo(text.resetSent);
    } catch (err) {
      setError(firebaseAuthErrorMessage(err, lang));
    }
  }

  return (
    <section className="tatreez-bg px-4 py-10 sm:px-6 lg:py-16">
      <div
        dir="ltr"
        className="mx-auto grid max-w-6xl items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)] lg:gap-14"
      >
        <div
          dir={dir}
          className="order-1 flex items-center rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-10 lg:px-12"
        >
          <div className="mx-auto w-full max-w-md">
            <div className="mb-7 text-center">
              <img src={logo} alt="Rawasi" className="mx-auto h-16 w-auto sm:h-20" />
              <h1 className="mt-5 text-2xl font-bold text-foreground sm:text-3xl">
                {text.heading}
              </h1>
              <p className="mt-2 text-muted-foreground">{text.subheading}</p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="login-email">{text.email}</Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  ref={emailRef}
                  autoComplete="email"
                  placeholder={text.emailPlaceholder}
                  required
                  className="h-11 bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">{text.password}</Label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={text.passwordPlaceholder}
                  minLength={8}
                  required
                  className="h-11 bg-background"
                />
              </div>

              <div className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember-me" />
                  <Label htmlFor="remember-me" className="cursor-pointer font-normal">
                    {text.remember}
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={handleForgot}
                  className="font-semibold text-primary hover:underline"
                >
                  {text.forgot}
                </button>
              </div>

              {error && (
                <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              {info && (
                <p role="status" className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
                  {info}
                </p>
              )}

              <Button type="submit" size="lg" disabled={submitting} className="h-11 w-full rounded-full">
                {submitting ? text.submitting : text.submit}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              {text.noAccount}{" "}
              <Link to="/signup" className="font-bold text-primary hover:underline">
                {text.signup}
              </Link>
            </p>

            <div className="my-5 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
              <span className="text-sm text-muted-foreground">{text.or}</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button asChild variant="outline" size="lg" className="h-11 w-full rounded-full">
              <Link to="/">{text.guest}</Link>
            </Button>
          </div>
        </div>

        <div className="order-2 hidden items-center justify-center py-3 sm:flex">
          <div className="relative w-full max-w-md px-5">
            <span className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border border-gold bg-background" />
            <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border border-gold bg-background" />
            <div className="h-[620px] overflow-hidden rounded-t-[13rem] rounded-b-3xl border border-gold bg-muted p-1.5 shadow-[var(--shadow-soft)]">
              <img
                src={sign_in_photo}
                alt={text.imageAlt}
                className="h-full w-full rounded-t-[12.5rem] rounded-b-[1.15rem] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
