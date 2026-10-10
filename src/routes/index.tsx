import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StoreLayout } from "@/components/StoreLayout";
import { ProductCard, type Product } from "@/components/ProductCard";
import { STORE_NAME } from "@/lib/store";
import hero from "@/assets/hero.jpg";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
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
  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const products = useQuery({
    queryKey: ["products"],
    queryFn: async () =>
      ((await supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false }))
        .data ?? []) as Product[],
  });

  const list = (products.data ?? []).filter(
    (p) => (!cat || p.category_id === cat) && (!q || p.name.toLowerCase().includes(q.toLowerCase())),
  );
  const featured = (products.data ?? []).filter((p) => p.featured);

  return (
    <StoreLayout>
      <section className="relative overflow-hidden rounded-3xl">
        <img src={hero} alt="أحذية کیوتی شوز" width={1536} height={768} className="h-48 w-full object-cover md:h-72" />
        <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-l from-primary/85 to-transparent p-6">
          <h1 className="font-display text-4xl font-extrabold text-primary-foreground md:text-6xl">{STORE_NAME}</h1>
          <p className="mt-2 text-lg font-bold text-secondary">خطوتك الحلوة تبدأ من هنا ✨</p>
        </div>
      </section>

      <div className="mt-5 flex items-center gap-2 rounded-full bg-muted px-4 py-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن منتج..."
          className="w-full bg-transparent outline-none"
        />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        <Chip active={!cat} onClick={() => setCat(null)}>الكل</Chip>
        {cats.data?.map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
            {c.name}
          </Chip>
        ))}
      </div>

      {featured.length > 0 && !cat && !q && (
        <section className="mt-6">
          <h2 className="mb-3 text-xl font-extrabold">الأكثر طلباً 💯✨</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {featured.slice(0, 4).map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-3 text-xl font-extrabold">كل المنتجات</h2>
        {products.isLoading ? (
          <p className="text-muted-foreground">جاري التحميل...</p>
        ) : list.length === 0 ? (
          <p className="rounded-2xl bg-muted p-8 text-center text-muted-foreground">لا توجد منتجات حالياً</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </StoreLayout>
  );
}

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-bold",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground",
      )}
    >
      {children}
    </button>
  );
}
