import { Link } from "@tanstack/react-router";
import { Globe, Menu, User, X } from "lucide-react";
import { useState } from "react";

import logoAsset from "@/assets/logo.png.asset.json";
import { useLanguage, type TKey } from "@/lib/i18n";
import { useMockAuth } from "@/lib/mock-auth";

const navItems: { to: string; key: TKey }[] = [
  { to: "/", key: "nav.home" },
  { to: "/about", key: "nav.about" },
  { to: "/categories", key: "nav.categories" },
  { to: "/explore", key: "nav.explore" },
  { to: "/my-contributions", key: "nav.contributions" },
];

export function Header() {
  const { t, toggleLang } = useLanguage();
  const { isLoggedIn, signOut } = useMockAuth();
  const [open, setOpen] = useState(false);

  const linkClass =
    "rounded-full px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-primary";

  return (
    <header className="sticky top-0 z-40 border-b border-[color-mix(in_oklab,var(--gold)_45%,transparent)] bg-background/90 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 py-3 lg:flex lg:justify-between">
        <Link to="/" className="order-2 flex min-w-0 shrink-0 items-center gap-2 justify-self-end">
          <img src={logoAsset.url} alt="Rawasi" className="h-10 w-auto sm:h-12" />
        </Link>

        <nav className="order-1 hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={linkClass}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="order-0 flex min-w-0 items-center gap-2">
          <button
            onClick={toggleLang}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,var(--gold)_60%,transparent)] px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
          >
            <Globe className="h-4 w-4" />
            {t("lang.toggle")}
          </button>

          {isLoggedIn ? (
            <button
              onClick={signOut}
              className="flex min-w-0 items-center gap-2 rounded-full bg-card px-2 py-1.5 text-sm font-medium"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </span>
              <span className="truncate">{t("auth.user")}</span>
            </button>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/login"
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-primary hover:bg-secondary"
              >
                {t("auth.login")}
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-opacity hover:opacity-90"
              >
                {t("auth.signup")}
              </Link>
            </div>
          )}

          <button
            aria-label={t("menu.open")}
            onClick={() => setOpen((v) => !v)}
            className="ms-auto grid h-9 w-9 shrink-0 place-items-center rounded-full bg-card text-primary lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border bg-card px-4 py-3 lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={linkClass}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {t(item.key)}
            </Link>
          ))}
          {!isLoggedIn && (
            <div className="mt-2 flex gap-2 sm:hidden">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-primary px-3 py-2 text-center text-sm font-semibold text-primary"
              >
                {t("auth.login")}
              </Link>
              <Link
                to="/signup"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
              >
                {t("auth.signup")}
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
