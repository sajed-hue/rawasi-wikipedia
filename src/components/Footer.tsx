import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, Youtube } from "lucide-react";

import logo from "@/assets/logo.png";
import longer_leaf from "@/assets/longer_leaf.png";
import footerPattern from "@/assets/footer_patern.png";
import { useLanguage } from "@/lib/i18n";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-[color-mix(in_oklab,var(--gold)_45%,transparent)] bg-card">
      {/* pattern: on the logo side (start) */}
      <img
        src={footerPattern}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 start-0 h-full w-auto max-w-none -scale-x-100 select-none opacity-70 rtl:scale-x-100"
        style={{
          maskImage: "linear-gradient(to left, black 55%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to left, black 55%, transparent 100%)",
        }}
      />

      {/* leaf: bottom corner on the end side (right in English, left in Arabic) */}
      <img
        src={longer_leaf}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 end-0 h-40 w-auto max-w-none translate-x-[8%] translate-y-[7%] -scale-x-100 select-none opacity-90 rtl:-translate-x-[8%] rtl:scale-x-100 sm:h-56 lg:h-[85%]"
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {/* logo first = start side */}
        <div>
          <img src={logo} alt="Rawasi" className="h-14 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {t("brand.tagline")}
          </p>
          <div className="mt-4 flex gap-2">
            {[Facebook, Instagram, Youtube, Mail].map((Icon, i) => (
              <span
                key={i}
                className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-lg font-bold text-primary">{t("footer.quick")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/explore" className="hover:text-primary">{t("footer.explore")}</Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-primary">{t("footer.about")}</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-lg font-bold text-primary">{t("footer.support")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>{t("footer.help")}</li>
            <li>{t("footer.contact")}</li>
            <li>{t("footer.privacy")}</li>
            <li>{t("footer.terms")}</li>
          </ul>
        </div>

        {/* empty column: leaves room for the leaf */}
        <div className="hidden lg:block" aria-hidden="true" />
      </div>

      <div className="relative border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} رواسي · {t("footer.rights")}
      </div>
    </footer>
  );
}