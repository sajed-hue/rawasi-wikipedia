import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, Coffee, FileText, House, Leaf, Plus, Search, Shirt, Shapes } from "lucide-react";
import { useState } from "react";
import village from "@/assets/contribution-village.webp.asset.json";
import grandmother from "@/assets/contribution-grandmother.webp.asset.json";
import pottery from "@/assets/card-pottery.webp.asset.json";
import tatreez from "@/assets/card-tatreez.webp.asset.json";
import olives from "@/assets/card-olive-harvest.webp.asset.json";
import coffee from "@/assets/hero-dallah.webp.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n";
import "@/components/contributions.css";

export const Route = createFileRoute("/my-contributions")({
  head: () => ({
    meta: [
      { title: "مشاركاتي | رواسي" },
      { name: "description", content: "مشاركاتي في رواسي: حكايات التراث الفلسطيني المنشورة والمساهمات قيد المراجعة." },
      { property: "og:title", content: "مشاركاتي | رواسي" },
      { property: "og:description", content: "تابع مشاركاتك وساهم في حفظ حكايات التراث الفلسطيني." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContributionsPage,
});

const copy = {
  ar: { title: "مشاركاتي", subtitle: "شارك حكايتك وساهم في حفظ تراثنا الفلسطيني", add: "إضافة مشاركة", addSoon: "إضافة المشاركات غير متاحة بعد", publishedStat: "تم نشرها", pending: "قيد المراجعة", total: "إجمالي المشاركات", recent: "مشاركاتي الأخيرة", search: "ابحث في مشاركاتك", all: "الكل", published: "منشورة", rejected: "مرفوضة", details: "عرض التفاصيل", empty: "لا توجد مشاركات تطابق بحثك", reset: "عرض كل المشاركات" },
  en: { title: "My Contributions", subtitle: "Share your story and help preserve our Palestinian heritage", add: "Add contribution", addSoon: "Adding contributions is not available yet", publishedStat: "Published", pending: "Under review", total: "Total contributions", recent: "My recent contributions", search: "Search your contributions", all: "All", published: "Published", rejected: "Rejected", details: "View details", empty: "No contributions match your search", reset: "Show all contributions" },
};

const submissions = [
  { id: "village", status: "published", image: village.url, icon: House, ar: { title: "ذاكرة القرية الفلسطينية", category: "العمارة والآثار", excerpt: "أزقة القرية وبيوتها الحجرية تحفظ حكايات أهلها وذكريات الطفولة.", body: "في أزقة القرية القديمة، تبقى البيوت الحجرية شاهدة على حياة أهلها. نجتمع في الساحة، ونستعيد حكايات الجيران ومواسم العودة إلى الأرض، لتبقى ذاكرة المكان حيّة بين الأجيال." }, en: { title: "Memories of a Palestinian village", category: "Architecture & antiquities", excerpt: "Stone houses and village lanes hold family stories and childhood memories.", body: "The old village’s stone houses bear witness to generations of everyday life. In its square, we recall neighbours, seasons on the land, and the stories that keep the memory of this place alive." } },
  { id: "pottery", status: "pending", image: pottery.url, icon: Shapes, ar: { title: "صناعة الفخار الفلسطيني", category: "المهارات والحرف التقليدية", excerpt: "من الطين إلى الجرّة، حرفة تتناقلها الأيدي جيلاً بعد جيل.", body: "تدور عجلة الفخّار، ويتحوّل الطين بين يدي الحرفي إلى جرّة أو إناء. أحكي هنا عن خطوات التشكيل والتجفيف، وعن الصبر الذي تعلّمته من مشاهدة هذه الحرفة التقليدية." }, en: { title: "Making Palestinian pottery", category: "Traditional crafts & skills", excerpt: "From clay to a finished vessel, a craft handed down through generations.", body: "As the pottery wheel turns, clay becomes a vessel in the craftsperson’s hands. This story follows shaping and drying, and the patience learned from watching a traditional craft." } },
  { id: "dress", status: "published", image: tatreez.url, icon: Shirt, ar: { title: "ثوب جدّتي المطرّز", category: "الأزياء والحلي", excerpt: "في كل غرزة على الثوب حكاية عن الهوية والانتماء.", body: "احتفظت جدّتي بثوبها المطرّز بعناية. كانت تشير إلى ألوانه وغرزه وتروي ذكريات المناسبات التي ارتدته فيها. أصبح الثوب في بيتنا ذاكرة نلمسها، وحكاية نواصل روايتها." }, en: { title: "My grandmother’s embroidered dress", category: "Dress & jewellery", excerpt: "Every stitch on the dress tells a story of identity and belonging.", body: "My grandmother carefully kept her embroidered dress. Its colours and stitches brought back memories of the occasions when she wore it. For our family, the dress became a tangible memory and a story to pass on." } },
  { id: "olives", status: "published", image: olives.url, icon: Leaf, ar: { title: "العونة في موسم الزيتون", category: "العادات والتقاليد الاجتماعية", excerpt: "تجمعنا أشجار الزيتون على العمل والفرح وتقاسم خبز الطابون.", body: "في موسم القطاف، نخرج إلى الأرض مع الأقارب والجيران. نتعاون في جمع الثمار، ونستريح تحت الأشجار على خبز الطابون. في العونة، يبقى العمل حكاية مشاركة ومحبة." }, en: { title: "Together for the olive harvest", category: "Social customs & traditions", excerpt: "Olive trees bring us together to work, celebrate, and share taboon bread.", body: "At harvest time, relatives and neighbours gather on the land. We collect the olives together and share bread beneath the trees. This tradition of mutual help turns work into a story of community." } },
  { id: "grandmother", status: "pending", image: grandmother.url, icon: BookOpen, ar: { title: "حكايات جدّتي", category: "الأدب الشفوي والقصصي", excerpt: "حكايات المساء التي بقيت في ذاكرتنا وصارت جزءاً من تراثنا.", body: "كنا نجتمع حول جدّتي في المساء وننتظر حكاية جديدة. تحمل قصصها الحكمة والخيال، وتعيد إلينا صوتها كلما رويناها. أوثّق هذه الذكريات كي تصل إلى من يأتي بعدنا." }, en: { title: "My grandmother’s stories", category: "Oral storytelling & literature", excerpt: "Evening tales that live in our memories and form part of our heritage.", body: "We gathered around my grandmother each evening, waiting for another story. Her tales carried wisdom and imagination. Retelling them brings back her voice and passes these memories to another generation." } },
  { id: "coffee", status: "published", image: coffee.url, icon: Coffee, ar: { title: "دلة القهوة وكرم الضيافة", category: "المقتنيات والأدوات اليومية", excerpt: "دلة نحاسية وفناجين صغيرة تحمل طقوس الاستقبال ودفء اللقاء.", body: "تتوسط دلة القهوة مجلس الضيوف في بيتنا. نرتّب الفناجين ونصبّ القهوة، وتبدأ معها الأحاديث. هذه القطع البسيطة تحمل ذكريات اللقاء، ومعنى الترحيب في حياتنا اليومية." }, en: { title: "The coffee set and hospitality", category: "Everyday objects & tools", excerpt: "A brass coffee pot and small cups carry rituals of welcome and warmth.", body: "The coffee pot takes its place at the centre of our family’s gathering. We arrange the cups and pour coffee as conversation begins. These simple objects hold memories of welcome and shared company." } },
] as const;

type Status = "all" | "pending" | "published" | "rejected";

function ContributionsPage() {
  const { lang, dir } = useLanguage();
  const t = copy[lang];
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Status>("all");
  const [selected, setSelected] = useState<(typeof submissions)[number] | null>(null);
  const needle = query.trim().toLocaleLowerCase(lang);
  const visible = submissions.filter((s) => (filter === "all" || s.status === filter) && `${s[lang].title} ${s[lang].category} ${s[lang].excerpt}`.toLocaleLowerCase(lang).includes(needle));
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const stats = [
    { label: t.publishedStat, count: submissions.filter((s) => s.status === "published").length, icon: CheckCircle2, tone: "contribution-published" },
    { label: t.pending, count: submissions.filter((s) => s.status === "pending").length, icon: Clock3, tone: "contribution-pending" },
    { label: t.total, count: submissions.length, icon: FileText, tone: "bg-secondary text-primary" },
  ];

  return (
    <div className="contributions-page mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12" dir={dir}>
      <header className="flex flex-col-reverse justify-between gap-6 sm:flex-row sm:items-center">
        <Button className="h-11 self-start rounded-full px-6 sm:self-auto" disabled title={t.addSoon}><Plus />{t.add}</Button>
        <div className="sm:text-end"><h1 className="font-display text-3xl leading-relaxed text-primary sm:text-4xl">{t.title}</h1><p className="mt-2 text-muted-foreground">{t.subtitle}</p></div>
      </header>

      <section aria-label={t.total} className="mt-9 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, count, icon: Icon, tone }) => <div key={label} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"><span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${tone}`}><Icon className="h-7 w-7" /></span><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-bold tabular-nums text-foreground">{count}</p></div></div>)}
      </section>

      <section className="mt-12" aria-labelledby="recent-contributions">
        <h2 id="recent-contributions" className="font-display text-xl text-primary sm:text-2xl">{t.recent}</h2>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} aria-label={t.search} className="h-11 rounded-full bg-background ps-12" /></div>
          <div className="flex flex-wrap gap-2" role="group" aria-label={lang === "ar" ? "حالة المشاركة" : "Contribution status"}>{(["all", "pending", "published", "rejected"] as const).map((status) => <Button key={status} variant={filter === status ? "default" : "outline"} aria-pressed={filter === status} onClick={() => setFilter(status)} className="rounded-full px-4">{t[status]}</Button>)}</div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {visible.map((submission) => {
            const text = submission[lang];
            const Icon = submission.icon;
            const StatusIcon = submission.status === "published" ? CheckCircle2 : Clock3;
            return <article key={submission.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="relative aspect-[16/10] overflow-hidden"><img src={submission.image} alt={text.title} loading="lazy" className="h-full w-full object-cover" /><span className={`absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${submission.status === "published" ? "contribution-published" : "contribution-pending"}`}><StatusIcon className="h-3.5 w-3.5" />{t[submission.status]}</span></div>
              <div className="flex flex-1 flex-col p-5"><h3 className="font-display text-lg leading-relaxed text-foreground">{text.title}</h3><p className="mt-3 flex items-center gap-2 text-xs text-primary"><Icon className="h-4 w-4 shrink-0" />{text.category}</p><p className="mt-3 line-clamp-1 text-sm text-muted-foreground" title={text.excerpt}>{text.excerpt}</p><Button variant="link" onClick={() => setSelected(submission)} className="mt-4 h-auto justify-start self-start p-0 text-tatreez">{t.details}<Arrow /></Button></div>
            </article>;
          })}
        </div>
        {visible.length === 0 && <div className="py-16 text-center"><FileText className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-4 text-muted-foreground">{t.empty}</p><Button variant="link" className="mt-3" onClick={() => { setFilter("all"); setQuery(""); }}>{t.reset}</Button></div>}
      </section>

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent dir={dir} className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border-border shadow-[var(--shadow-card)]">
          {selected && <><DialogTitle className="pe-5 text-start font-display leading-relaxed tracking-normal text-primary">{selected[lang].title}</DialogTitle><DialogDescription className="text-start">{selected[lang].category} · {t[selected.status]}</DialogDescription><img src={selected.image} alt={selected[lang].title} className="aspect-[16/10] w-full rounded-xl object-cover" /><p className="text-sm leading-8 text-foreground">{selected[lang].body}</p></>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
