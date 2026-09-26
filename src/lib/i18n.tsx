import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ar" | "en";

const dictionary = {
  ar: {
    "nav.home": "الرئيسية",
    "nav.about": "من نحن",
    "nav.categories": "أقسام التراث",
    "nav.explore": "استكشف التراث",
    "nav.contributions": "مشاركتك",
    "auth.login": "تسجيل الدخول",
    "auth.signup": "إنشاء حساب",
    "auth.user": "ثراء نعيم",
    "lang.toggle": "EN",
    "brand.tagline": "لحفظ التراث الفلسطيني - معاً لنصنع جيل أكثر وعياً",
    "footer.support": "الدعم",
    "footer.help": "مركز المساعدة",
    "footer.contact": "تواصل معنا",
    "footer.privacy": "سياسة الخصوصية",
    "footer.terms": "شروط الاستخدام",
    "footer.quick": "روابط سريعة",
    "footer.explore": "استكشاف",
    "footer.categories": "التصنيفات",
    "footer.about": "من نحن",
    "footer.ai": "المساعد الذكي",
    "footer.rights": "جميع الحقوق محفوظة",
    "ai.title": "المساعد الذكي",
    "ai.subtitle": "قريباً — مساعدك للتعرف على التراث الفلسطيني",
    "ai.placeholder": "اكتب سؤالك...",
    "ai.open": "فتح المساعد الذكي",
    "menu.open": "القائمة",
    "home.badge": "منصة التراث الفلسطيني",
    "home.title": "رواسي",
    "home.lead":
      "منصة تشاركية لحفظ التراث الفلسطيني وتوثيقه، من الحكايات والتطريز إلى الأكلات والأمثال.",
    "home.cta": "استكشف التراث",
    "home.cta2": "شارك قصتك",
    "page.soon": "هذه الصفحة قيد الإنشاء",
    "page.about": "من نحن",
    "page.explore": "استكشف التراث",
    "page.categories": "أقسام التراث",
    "page.contributions": "مشاركتك",
    "page.login": "تسجيل الدخول",
    "page.signup": "إنشاء حساب",
  },
  en: {
    "nav.home": "Home",
    "nav.about": "About",
    "nav.categories": "Categories",
    "nav.explore": "Explore Heritage",
    "nav.contributions": "My Contributions",
    "auth.login": "Login",
    "auth.signup": "Sign up",
    "auth.user": "Tharaa Naeem",
    "lang.toggle": "ع",
    "brand.tagline": "Preserving Palestinian heritage — together for a more aware generation",
    "footer.support": "Support",
    "footer.help": "Help Center",
    "footer.contact": "Contact Us",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Use",
    "footer.quick": "Quick Links",
    "footer.explore": "Explore",
    "footer.categories": "Categories",
    "footer.about": "About",
    "footer.ai": "AI Assistant",
    "footer.rights": "All rights reserved",
    "ai.title": "AI Assistant",
    "ai.subtitle": "Coming soon — your guide to Palestinian heritage",
    "ai.placeholder": "Type your question...",
    "ai.open": "Open AI assistant",
    "menu.open": "Menu",
    "home.badge": "Palestinian Heritage Platform",
    "home.title": "Rawasi",
    "home.lead":
      "A community platform to preserve and document Palestinian heritage — from stories and tatreez to food and proverbs.",
    "home.cta": "Explore Heritage",
    "home.cta2": "Share your story",
    "page.soon": "This page is under construction",
    "page.about": "About Us",
    "page.explore": "Explore Heritage",
    "page.categories": "Heritage Categories",
    "page.contributions": "My Contributions",
    "page.login": "Login",
    "page.signup": "Sign up",
  },
} as const;

export type TKey = keyof (typeof dictionary)["ar"];

type Ctx = {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (key: TKey) => string;
  toggleLang: () => void;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");

  useEffect(() => {
    const stored = localStorage.getItem("rawasi-lang");
    if (stored === "en" || stored === "ar") setLang(stored);
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem("rawasi-lang", lang);
  }, [lang]);

  const toggleLang = useCallback(() => setLang((l) => (l === "ar" ? "en" : "ar")), []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      t: (key: TKey) => dictionary[lang][key],
      toggleLang,
    }),
    [lang, toggleLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
