import { T } from "@/lib/i18n";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Footprints } from "lucide-react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { StoreLayout, BrandButton } from "@/components/StoreLayout";
import { EmptyState } from "@/components/ui-kit";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "سلة التسوق | کیوتی شوز" },
      { name: "description", content: "راجع منتجاتك قبل إتمام الطلب." },
      { property: "og:title", content: "سلة التسوق | کیوتی شوز" },
      { property: "og:description", content: "راجع منتجاتك قبل إتمام الطلب." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const { session } = useAuth();
  const navigate = useNavigate();

  return (
    <StoreLayout>
      <h1 className="mb-4 text-2xl font-extrabold">
        {T("سلة التسوق","Shopping cart")} <span className="text-base font-normal text-muted-foreground">({cart.count} {T("منتجات","items")})</span>
      </h1>
      {cart.items.length === 0 ? (
        <EmptyState emoji="bag" title={T(T("سلتك فاضية","Your cart is empty"),"Your cart is empty")} text={T(T("أضف أحذية تعجبك وارجع هنا","Add shoes you love and come back"),"Add shoes you love and come back")} action={{ label: T("تسوق الآن","Shop now"), to: "/" }} />
      ) : (
        <>
          <div className="space-y-3">
            <AnimatePresence initial={false}>
            {cart.items.map((i) => (
              <motion.div layout key={i.product_id + i.size} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -80, height: 0 }} className="flex gap-3 overflow-hidden rounded-3xl bg-card p-3 shadow-soft">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {i.image_url ? <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Footprints className="h-8 w-8 text-primary/40" /></div>}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <p className="font-bold text-primary">{i.name}</p>
                    {i.size && <p className="text-sm text-muted-foreground">{T("المقاس:","Size:")} {i.size}</p>}
                    <p className="font-extrabold">{money(i.price)}</p>
                  </div>
                  <div className="flex w-fit items-center gap-4 rounded-xl border-2 border-primary/30 px-3 py-1.5">
                    <button onClick={() => cart.setQty(i.product_id, i.size, i.qty + 1)}><Plus className="h-4 w-4 text-primary" /></button>
                    <span className="font-bold">{i.qty}</span>
                    {i.qty > 1 ? (
                      <button onClick={() => cart.setQty(i.product_id, i.size, i.qty - 1)}><Minus className="h-4 w-4" /></button>
                    ) : (
                      <button onClick={() => cart.remove(i.product_id, i.size)}><Trash2 className="h-4 w-4 text-destructive" /></button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-accent p-4">
            <span className="text-2xl font-extrabold">{money(cart.subtotal)}</span>
            <span className="text-sm text-muted-foreground">{T("+ رسوم التوصيل حسب المدينة","+ delivery fee by city")}</span>
          </div>
          <BrandButton className="mt-4" onClick={() => session ? navigate({ to: "/checkout" }) : navigate({ to: "/auth", search: { next: "/checkout" } })}>
            {T("إتمام الشراء","Checkout")}
          </BrandButton>
        </>
      )}
    </StoreLayout>
  );
}
