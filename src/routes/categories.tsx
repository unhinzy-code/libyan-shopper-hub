import catAll from "@/assets/cat-all.jpg";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Footprints, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StoreLayout } from "@/components/StoreLayout";
import { ProductCard, type Product } from "@/components/ProductCard";
import { EmptyState } from "@/components/ui-kit";
import { buzz } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "الأقسام | کیوتی شوز" },
      { name: "description", content: "تصفح كل أقسام الأحذية في کیوتی شوز." },
      { property: "og:title", content: "الأقسام | کیوتی شوز" },
      { property: "og:description", content: "تصفح كل أقسام الأحذية." },
    ],
  }),
  component: Categories,
});

function Categories() {
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
  const list = (products.data ?? []).filter((p) => !cat || p.category_id === cat);
  const items = [{ id: null as string | null, name: "الكل", image_url: catAll as string | null }, ...(cats.data ?? [])];

  return (
    <StoreLayout>
      <div className="-mx-4 -my-5 flex min-h-[calc(100vh-4rem)]">
        <aside className="no-scrollbar sticky top-16 h-[calc(100vh-4rem)] w-24 shrink-0 overflow-y-auto bg-muted/60 pb-28 sm:w-32">
          {items.map((c, i) => {
            const active = cat === c.id;
            return (
              <motion.button
                key={c.id ?? "all"}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => { buzz(); setCat(c.id); }}
                className={cn("relative flex w-full flex-col items-center gap-1.5 px-2 py-4 text-center text-xs font-bold transition-colors", active ? "bg-card text-primary" : "text-muted-foreground")}
              >
                {active && <motion.span layoutId="cat-bar" className="absolute inset-y-0 right-0 w-1 rounded-l-full bg-primary" />}
                <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-accent">
                  {c.image_url ? <img src={c.image_url} alt="" loading="lazy" className="h-full w-full object-cover" /> : c.id ? <Footprints className="h-5 w-5 text-primary" /> : <LayoutGrid className="h-5 w-5 text-primary" />}
                </span>
                <span className="line-clamp-2">{c.name}</span>
              </motion.button>
            );
          })}
        </aside>
        <section className="min-w-0 flex-1 p-3 pb-28">
          <AnimatePresence mode="wait">
            <motion.div key={cat ?? "all"} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
              <h1 className="mb-3 text-lg font-extrabold">{items.find((c) => c.id === cat)?.name}</h1>
              {products.isLoading ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-muted" />)}
                </div>
              ) : list.length === 0 ? (
                <EmptyState emoji="shoe" title="لا توجد منتجات هنا" text="جرب قسم آخر" />
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {list.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </StoreLayout>
  );
}
