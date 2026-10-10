import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { StoreLayout, BrandButton } from "@/components/StoreLayout";
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
        سلة التسوق <span className="text-base font-normal text-muted-foreground">({cart.count} منتجات)</span>
      </h1>
      {cart.items.length === 0 ? (
        <div className="rounded-2xl bg-muted p-10 text-center">
          <p className="mb-4 text-muted-foreground">سلتك فاضية</p>
          <Link to="/" className="font-bold text-primary underline">تسوق الآن</Link>
        </div>
      ) : (
        <>
          <div className="divide-y rounded-2xl border bg-card">
            {cart.items.map((i) => (
              <div key={i.product_id + i.size} className="flex gap-3 p-3">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {i.image_url ? <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-3xl">👟</div>}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <p className="font-bold text-primary">{i.name}</p>
                    {i.size && <p className="text-sm text-muted-foreground">المقاس: {i.size}</p>}
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
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-accent p-4">
            <span className="text-2xl font-extrabold">{money(cart.subtotal)}</span>
            <span className="text-sm text-muted-foreground">+ رسوم التوصيل حسب المدينة</span>
          </div>
          <BrandButton className="mt-4" onClick={() => navigate({ to: session ? "/checkout" : "/auth", search: session ? undefined : { next: "/checkout" } } as never)}>
            إتمام الشراء
          </BrandButton>
        </>
      )}
    </StoreLayout>
  );
}
