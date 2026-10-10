import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Banknote, Landmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StoreLayout, BrandButton } from "@/components/StoreLayout";
import { BankList } from "@/components/BankList";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "مراجعة الطلب | کیوتی شوز" },
      { name: "description", content: "اختر مدينتك وطريقة الدفع لإتمام طلبك." },
      { property: "og:title", content: "مراجعة الطلب | کیوتی شوز" },
      { property: "og:description", content: "اختر مدينتك وطريقة الدفع." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const cart = useCart();
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [cityId, setCityId] = useState("");
  const [details, setDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<"cash" | "transfer">("cash");
  const [bank, setBank] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cities = useQuery({
    queryKey: ["cities"],
    queryFn: async () => (await supabase.from("cities").select("*").eq("active", true).order("name")).data ?? [],
  });
  const city = cities.data?.find((c) => c.id === cityId);
  const fee = Number(city?.delivery_fee ?? 0);

  if (!loading && !session)
    return (
      <StoreLayout>
        <p>لازم تسجل دخول أولاً. <Link to="/auth" search={{ next: "/checkout" }} className="font-bold text-primary underline">دخول</Link></p>
      </StoreLayout>
    );
  if (cart.items.length === 0)
    return <StoreLayout><p>السلة فاضية. <Link to="/" className="text-primary underline">تسوق</Link></p></StoreLayout>;

  const place = async () => {
    if (!cityId) return toast.error("اختر المدينة");
    if (payment === "transfer" && !bank) return toast.error("اختر المصرف الذي ستحول إليه");
    setBusy(true);
    const { data, error } = await supabase.rpc("place_order", {
      _items: cart.items.map((i) => ({ product_id: i.product_id, qty: i.qty, size: i.size })),
      _city_id: cityId,
      _details: details,
      _payment: payment,
      _bank: bank ?? "",
      _notes: notes,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    cart.clear();
    const res = data as { id: string };
    navigate({ to: "/order/$id", params: { id: res.id } });
  };

  return (
    <StoreLayout>
      <h1 className="mb-4 text-2xl font-extrabold">مراجعة الطلب</h1>
      <div className="space-y-5">
        <section className="space-y-3 rounded-2xl border bg-card p-4">
          <h2 className="font-bold">📍 عنوان التوصيل</h2>
          <select value={cityId} onChange={(e) => setCityId(e.target.value)} className="w-full rounded-xl border-2 bg-card px-4 py-3">
            <option value="">اختر المدينة</option>
            {cities.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — توصيل {money(c.delivery_fee)}</option>
            ))}
          </select>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} placeholder="تفاصيل العنوان (اختياري): الحي، الشارع، أقرب معلم..." className="min-h-20 w-full rounded-xl border-2 px-4 py-3" />
        </section>

        <section className="space-y-3 rounded-2xl border bg-card p-4">
          <h2 className="font-bold">طريقة الدفع</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: "cash" as const, label: "نقداً عند الاستلام", Icon: Banknote },
              { k: "transfer" as const, label: "تحويل مصرفي", Icon: Landmark },
            ].map(({ k, label, Icon }) => (
              <button key={k} onClick={() => setPayment(k)} className={cn("flex flex-col items-center gap-2 rounded-xl border-2 p-4 font-bold", payment === k ? "border-primary bg-accent text-primary" : "")}>
                <Icon className="h-7 w-7" />
                {label}
              </button>
            ))}
          </div>
          {payment === "transfer" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">اختر المصرف وحوّل المبلغ لأحد الحسابات التالية:</p>
              <BankList selected={bank} onSelect={setBank} />
              <p className="rounded-xl bg-secondary/30 p-3 text-sm font-bold">
                ⚠️ بعد التحويل، تأكد من إرسال صورة الإيصال مع رقم الطلب لتأكيد الدفع.
              </p>
            </div>
          )}
        </section>

        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="ملاحظات الطلب (اختياري)" className="min-h-16 w-full rounded-xl border-2 px-4 py-3" />

        <section className="space-y-2 rounded-2xl bg-accent p-4">
          <Row k="المجموع الجزئي" v={money(cart.subtotal)} />
          <Row k="التوصيل" v={city ? money(fee) : "—"} />
          <div className="border-t pt-2"><Row k="المجموع الكلي" v={money(cart.subtotal + fee)} bold /></div>
        </section>
        <BrandButton disabled={busy} onClick={place}>{busy ? "..." : `اطلب الآن ${money(cart.subtotal + fee)}`}</BrandButton>
      </div>
    </StoreLayout>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between", bold && "text-lg font-extrabold")}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}
