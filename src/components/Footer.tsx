import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, Youtube } from "lucide-react";

import logoAsset from "@/assets/logo.png.asset.json";
import oliveAsset from "@/assets/olive-branch.png.asset.json";
import { useLanguage } from "@/lib/i18n";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-[color-mix(in_oklab,var(--gold)_45%,transparent)] bg-card">
      <div className="tatreez-bg pointer-events-none absolute bottom-0 end-0 h-32 w-32 opacity-40" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-start justify-center lg:justify-start">
          <img src={oliveAsset.url} alt="" className="h-32 w-auto opacity-80" />
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

        <div>
          <h4 className="mb-4 text-lg font-bold text-primary">{t("footer.quick")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/explore" className="hover:text-primary">
                {t("footer.explore")}
              </Link>
            </li>
            <li>
              <Link to="/categories" className="hover:text-primary">
                {t("footer.categories")}
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-primary">
                {t("footer.about")}
              </Link>
            </li>
            <li>{t("footer.ai")}</li>
          </ul>
        </div>

        <div>
          <img src={logoAsset.url} alt="Rawasi" className="h-14 w-auto" />
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
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} رواسي · {t("footer.rights")}
      </div>
    </footer>
  );
}
