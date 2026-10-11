import { T } from "@/lib/i18n";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Footprints } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StoreLayout, BrandButton } from "@/components/StoreLayout";
import type { Product } from "@/components/ProductCard";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل المنتج | کیوتی شوز" },
      { name: "description", content: "تفاصيل المنتج والمقاسات المتوفرة في کیوتی شوز." },
      { property: "og:title", content: "تفاصيل المنتج | کیوتی شوز" },
      { property: "og:description", content: "المقاسات والسعر وطريقة الطلب." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const cart = useCart();
  const navigate = useNavigate();
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState("");
  const { data: p, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => (await supabase.from("products").select("*").eq("id", id).maybeSingle()).data as Product | null,
  });

  if (isLoading) return <StoreLayout><p>{T("جاري التحميل...","Loading...")}</p></StoreLayout>;
  if (!p) return <StoreLayout><p>{T("المنتج غير موجود.","Product not found.")} <Link to="/" className="text-primary underline">{T("رجوع","Back")}</Link></p></StoreLayout>;

  const off = p.old_price && p.old_price > p.price ? Math.round((1 - p.price / p.old_price) * 100) : 0;
  const out = p.stock <= 0;

  const add = (go: boolean) => {
    if (p.sizes.length && !size) return toast.error(T("اختر المقاس أولاً","Choose a size first"));
    const colors = (p as Product & { colors?: string[] }).colors ?? [];
    if (colors.length && !color) return toast.error(T("اختر اللون أولاً","Choose a color first"));
    if (qty > p.stock) return toast.error(T(`المتوفر فقط ${p.stock}`,`Only ${p.stock} available`));
    cart.add({ product_id: p.id, name: p.name, price: Number(p.price), image_url: p.image_url, size: [size, color].filter(Boolean).join(" · "), qty });
    toast.success(T("تمت الإضافة إلى السلة","Added to cart"));
    if (go) navigate({ to: "/cart" });
  };

  return (
    <StoreLayout>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-3xl bg-muted">
          {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Footprints className="h-20 w-20 text-primary/40" /></div>}
        </div>
        <div className="space-y-5">
          <h1 className="text-3xl font-extrabold">{p.name}</h1>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-extrabold text-primary">{money(p.price)}</span>
            {off > 0 && (
              <>
                <span className="text-muted-foreground line-through">{money(p.old_price)}</span>
                <span className="rounded-lg border border-destructive bg-destructive/10 px-3 py-1 font-bold text-destructive">-{off}% {T("تخفيض","off")}</span>
              </>
            )}
          </div>
          {p.description && <p className="whitespace-pre-line text-muted-foreground">{p.description}</p>}
          {p.sizes.length > 0 && (
            <div>
              <h2 className="mb-2 font-bold">{T("مقاس المنتج","Size")}</h2>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)} className={cn("min-w-14 rounded-full border px-4 py-2 font-bold", size === s ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {((p as Product & { colors?: string[] }).colors ?? []).length > 0 && (
            <div>
              <h2 className="mb-2 font-bold">{T("اللون","Color")}</h2>
              <div className="flex flex-wrap gap-2">
                {(p as Product & { colors?: string[] }).colors!.map((c) => (
                  <button key={c} onClick={() => setColor(c)} className={cn("rounded-full border px-4 py-2 font-bold transition active:scale-95", color === c ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className={cn("text-sm font-bold", out ? "text-destructive" : p.stock < 5 ? "text-secondary-foreground" : "text-success")}>
            {out ? T("نفذت الكمية","Out of stock") : p.stock < 5 ? T(`باقي ${p.stock} فقط!`,`Only ${p.stock} left!`) : T("متوفر","In stock")}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 rounded-xl border-2 border-primary/30 px-4 py-3">
              <button onClick={() => setQty(qty + 1)}><Plus className="h-5 w-5 text-primary" /></button>
              <span className="w-6 text-center font-bold">{qty}</span>
              <button onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-5 w-5" /></button>
            </div>
            <button disabled={out} onClick={() => add(false)} className="flex-1 rounded-xl border-2 border-primary py-3 font-bold text-primary disabled:opacity-50">
              {T("أضف للسلة","Add to cart")}
            </button>
          </div>
          <BrandButton disabled={out} onClick={() => add(true)}>{T("اشتري الآن","Buy now")}</BrandButton>
        </div>
      </div>
    </StoreLayout>
  );
}
