import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type SyntheticEvent } from "react";
import { useMockAuth } from "@/lib/mock-auth";

import logoAsset from "@/assets/logo.png.asset.json";
import signInPhoto from "@/assets/sing_in_photo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب | رواسي" },
      { name: "description", content: "أنشئ حسابك وشارك في توثيق التراث الفلسطيني." },
      { property: "og:title", content: "إنشاء حساب | رواسي" },
      { property: "og:description", content: "انضم إلى منصة رواسي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignupPage,
});

const copy = {
  ar: {
    heading: "إنشاء حساب في رواسي",
    subheading: "انضم إلينا واكتشف حكايات تراثنا",
    fullName: "الاسم الكامل",
    fullNamePlaceholder: "أدخل اسمك الكامل",
    email: "البريد الألكتروني",
    emailPlaceholder: "أدخل بريدك الإلكتروني",
    password: "كلمة المرور",
    passwordPlaceholder: "أنشئ كلمة مرور",
    terms: "أوافق على شروط الاستخدام وسياسة الخصوصية",
    termsError: "يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية",
    submit: "إنشاء حساب",
    hasAccount: "لديك حساب بالفعل؟",
    login: "تسجيل الدخول",
    imageAlt: "قوس حجري تراثي فلسطيني",
  },
  en: {
    heading: "Create a Rawasi account",
    subheading: "Join us and discover the stories of our heritage",
    fullName: "Full Name",
    fullNamePlaceholder: "Enter your full name",
    email: "Email",
    emailPlaceholder: "Enter your email",
    password: "Password",
    passwordPlaceholder: "Create a password",
    terms: "I agree to the Terms of Use and Privacy Policy",
    termsError: "Please agree to the Terms of Use and Privacy Policy",
    submit: "Create account",
    hasAccount: "Already have an account?",
    login: "Log in",
    imageAlt: "Traditional Palestinian stone arch",
  },
} as const;

function SignupPage() {
  const { lang, dir } = useLanguage();
  const text = copy[lang];
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const { signIn } = useMockAuth();
  const navigate = useNavigate();

  /**
   * handleSubmit: runs when the signup form is submitted (mock signup).
   * 1. preventDefault() stops the page from reloading.
   * 2. If the terms checkbox is not ticked, shows the terms error and stops.
   * 3. Otherwise signs the new user in as a normal "user" and goes home.
   *    Real account creation will be handled by Firebase later.
   */
  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowTermsError(!termsAccepted);
    if (!termsAccepted) return;
        const name = String(new FormData(event.currentTarget).get("name") ?? "");
    signIn("user", name);
    navigate({ to: "/" });
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
            <div className="mb-6 text-center">
              <img src={logoAsset.url} alt="Rawasi" className="mx-auto h-14 w-auto sm:h-16" />
              <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
                {text.heading}
              </h1>
              <p className="mt-2 text-muted-foreground">{text.subheading}</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="signup-name">{text.fullName}</Label>
                <Input
                  id="signup-name"
                  name="name"
                  autoComplete="name"
                  placeholder={text.fullNamePlaceholder}
                  minLength={2}
                  required
                  className="h-11 bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">{text.email}</Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={text.emailPlaceholder}
                  required
                  className="h-11 bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">{text.password}</Label>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={text.passwordPlaceholder}
                  minLength={8}
                  required
                  className="h-11 bg-background"
                />
              </div>

              <div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="accept-terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => {
                      const isAccepted = checked === true;
                      setTermsAccepted(isAccepted);
                      if (isAccepted) setShowTermsError(false);
                    }}
                    aria-invalid={showTermsError}
                    aria-describedby={showTermsError ? "terms-error" : undefined}
                  />
                  <Label htmlFor="accept-terms" className="cursor-pointer font-normal leading-5">
                    {text.terms}
                  </Label>
                </div>
                {showTermsError && (
                  <p id="terms-error" role="alert" className="mt-2 text-sm text-destructive">
                    {text.termsError}
                  </p>
                )}
              </div>

              <Button type="submit" size="lg" className="h-11 w-full rounded-full">
                {text.submit}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              {text.hasAccount}{" "}
              <Link to="/login" className="font-bold text-primary hover:underline">
                {text.login}
              </Link>
            </p>
          </div>
        </div>

        <div className="order-2 hidden items-center justify-center py-3 sm:flex">
          <div className="relative w-full max-w-md px-5">
            <span className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border border-gold bg-background" />
            <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border border-gold bg-background" />
            <div className="h-[620px] overflow-hidden rounded-t-[13rem] rounded-b-3xl border border-gold bg-muted p-1.5 shadow-[var(--shadow-soft)]">
              <img
                src={signInPhoto.url}
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
