import { T } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Footprints, LayoutGrid } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StoreLayout } from "@/components/StoreLayout";
import { ProductCard, type Product } from "@/components/ProductCard";
import { EmptyState } from "@/components/ui-kit";
import { buzz } from "@/lib/haptics";
import hero from "@/assets/hero-banner.jpg";
import heroMobile from "@/assets/hero-mobile.jpg";
import slide2 from "@/assets/hero-slide-2.jpg";
import slide3 from "@/assets/hero-slide-3.jpg";
import { HeroCarousel } from "@/components/HeroCarousel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } => ({
    q: typeof s.q === "string" && s.q ? s.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "کیوتی شوز | أحذية أنيقة في كل ليبيا" },
      { name: "description", content: "تسوق أحدث الأحذية من کیوتی شوز مع توصيل لكل المدن الليبية. دفع نقدي أو تحويل مصرفي." },
      { property: "og:title", content: "کیوتی شوز | أحذية أنيقة في كل ليبيا" },
      { property: "og:description", content: "توصيل لكل المدن الليبية. دفع نقدي أو تحويل مصرفي." },
    ],
  }),
  component: Index,
});

function Index() {
  const { q } = Route.useSearch();
  const [cat, setCat] = useState<string | null>(null);
  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const products = useQuery({
    queryKey: ["products"],
    queryFn: async () =>
      ((await supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false })).data ?? []) as Product[],
  });

  const list = (products.data ?? []).filter(
    (p) => (!cat || p.category_id === cat) && (!q || p.name.toLowerCase().includes(q.toLowerCase())),
  );
  const featured = (products.data ?? []).filter((p) => p.featured);
  const deals = (products.data ?? []).filter((p) => p.old_price && p.old_price > p.price);

  return (
    <StoreLayout overHero>
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="relative w-full overflow-hidden">
        <div className="md:hidden"><HeroCarousel slides={[heroMobile, slide2, slide3]} /></div>
        <div className="hidden md:block"><HeroCarousel slides={[hero, slide2, slide3]} /></div>
      </motion.section>

      <div className="mx-auto max-w-6xl px-4">
        {q && (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-accent px-4 py-3 text-sm font-bold">
            <span>{T("نتائج البحث عن:","Search results for:")} {q}</span>
            <Link to="/" search={{}} className="text-primary">{T("مسح","Clear")}</Link>
          </div>
        )}

        <section className="mt-4">
          <h2 className="mb-3 text-lg font-extrabold">{T("الأقسام","Categories")}</h2>
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
            <CatBubble active={!cat} icon={<LayoutGrid className="h-7 w-7 text-primary" />} label={T("الكل","All")} onClick={() => setCat(null)} />
            {cats.data?.map((c, i) => (
              <CatBubble key={c.id} i={i} active={cat === c.id} label={c.name} img={c.image_url} onClick={() => setCat(c.id)} />
            ))}
          </div>
        </section>

        {featured.length > 0 && !cat && !q && (
          <Section title={T("الأكثر طلباً","Best sellers")}>
            {featured.slice(0, 4).map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
          </Section>
        )}
        {deals.length > 0 && !cat && !q && (
          <Section title={T("تخفيضات","Sales")}>
            {deals.slice(0, 4).map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
          </Section>
        )}

        <Section title={T("كل المنتجات","All products")}>
          {products.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-muted" />)
            : list.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
        </Section>
        {!products.isLoading && list.length === 0 && <EmptyState emoji="shoe" title={T("لا توجد منتجات","No products")} text={T("جرب قسم آخر أو بحث مختلف","Try another category or search")} />}
      </div>
    </StoreLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-3 text-lg font-extrabold">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{children}</div>
    </section>
  );
}

function CatBubble({ label, img, icon, active, onClick, i = 0 }: { label: string; img?: string | null; icon?: React.ReactNode; active: boolean; onClick: () => void; i?: number }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => { buzz(); onClick(); }}
      className="flex w-20 shrink-0 flex-col items-center gap-1.5"
    >
      <span className={cn("flex h-18 w-18 items-center justify-center overflow-hidden rounded-full border-2 bg-accent p-0.5 transition", active ? "border-primary shadow-brand" : "border-transparent")}>
        {img ? <img src={img} alt={label} loading="lazy" className="h-full w-full rounded-full object-cover" /> : icon ?? <Footprints className="h-7 w-7 text-primary" />}
      </span>
      <span className={cn("line-clamp-1 text-xs font-bold", active ? "text-primary" : "text-foreground")}>{label}</span>
    </motion.button>
  );
}
