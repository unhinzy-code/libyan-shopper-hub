import { T } from "@/lib/i18n";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Banknote, Landmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StoreLayout, BrandButton } from "@/components/StoreLayout";
import { BankList } from "@/components/BankList";
import { EmptyState, PhoneField } from "@/components/ui-kit";
import { normalizePhone } from "@/lib/store";
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
  const { session, loading, profile } = useAuth();
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const shownPhone = phoneTouched ? phone : profile?.phone ?? "";
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
  const saved = useQuery({
    queryKey: ["addresses", session?.user.id],
    enabled: !!session,
    queryFn: async () => (await supabase.from("addresses").select("*").order("is_default", { ascending: false })).data ?? [],
  });
  const [pickedAddr, setPickedAddr] = useState<string | null>(null);
  const useAddr = (a: { id: string; city_id: string | null; details: string; phone: string; full_name: string }) => {
    setPickedAddr(a.id);
    if (a.city_id) setCityId(a.city_id);
    setDetails([a.full_name, a.details].filter(Boolean).join(" — "));
    setPhoneTouched(true);
    setPhone(a.phone);
  };
  useEffect(() => {
    const d = saved.data?.[0];
    if (d && !pickedAddr && !cityId) useAddr(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved.data]);
  const city = cities.data?.find((c) => c.id === cityId);
  const fee = Number(city?.delivery_fee ?? 0);

  if (!loading && !session)
    return <StoreLayout><EmptyState emoji="lock" title={T(T("سجّل دخول لإتمام الطلب","Sign in to place your order"),"Sign in to place your order")} action={{ label: T("دخول","Sign in"), to: "/auth", search: { next: "/checkout" } }} /></StoreLayout>;
  if (cart.items.length === 0)
    return <StoreLayout><EmptyState emoji="bag" title={T(T("السلة فاضية","Cart is empty"),"Cart is empty")} action={{ label: T("تسوق","Shop"), to: "/" }} /></StoreLayout>;

  const place = async () => {
    if (!cityId) return toast.error(T("اختر المدينة","Choose city"));
    if (payment === "transfer" && !bank) return toast.error(T("اختر المصرف الذي ستحول إليه","Choose the bank you will transfer to"));
    const ph = normalizePhone(shownPhone);
    if (!ph) return toast.error(T("رقم الهاتف غير صحيح","Invalid phone number"));
    setBusy(true);
    const fullNotes = ph !== profile?.phone ? `رقم التواصل: ${ph}\n${notes}` : notes;
    const { data, error } = await supabase.rpc("place_order", {
      _items: cart.items.map((i) => ({ product_id: i.product_id, qty: i.qty, size: i.size })),
      _city_id: cityId,
      _details: details,
      _payment: payment,
      _bank: bank ?? "",
      _notes: fullNotes,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    cart.clear();
    const res = data as { id: string };
    navigate({ to: "/order/$id", params: { id: res.id }, search: { placed: true } });
  };

  return (
    <StoreLayout>
      <h1 className="mb-4 text-2xl font-extrabold">{T("مراجعة الطلب","Review order")}</h1>
      <div className="space-y-5">
        <section className="space-y-3 rounded-3xl bg-card p-4 shadow-soft">
          {(saved.data?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <h2 className="font-bold">{T("عناويني المحفوظة","My saved addresses")}</h2>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {saved.data!.map((a) => (
                  <button key={a.id} onClick={() => useAddr(a)} className={cn("shrink-0 rounded-2xl border-2 px-4 py-2 text-sm font-bold transition active:scale-95", pickedAddr === a.id ? "border-primary bg-accent text-primary" : "")}>
                    {a.label || a.full_name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Link to="/addresses" className="text-sm font-bold text-primary underline">{T("+ إدارة العناوين","+ Manage addresses")}</Link>
          <h2 className="font-bold">{T("رقم التواصل","Contact number")}</h2>
          <PhoneField value={shownPhone} onChange={(v) => { setPhoneTouched(true); setPhone(v); }} />
          <h2 className="font-bold">{T("عنوان التوصيل","Delivery address")}</h2>
          <select value={cityId} onChange={(e) => setCityId(e.target.value)} className="w-full rounded-2xl border-2 bg-card px-4 py-3 outline-none focus:border-primary">
            <option value="">{T("اختر المدينة","Choose city")}</option>
            {cities.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {money(c.delivery_fee)}{c.delivery_days ? ` (${c.delivery_days})` : ""}</option>
            ))}
          </select>
          {city?.delivery_days && <p className="rounded-xl bg-accent px-3 py-2 text-sm font-bold text-accent-foreground">{T("أيام التوصيل:","Delivery days:")} {city.delivery_days}</p>}
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} placeholder={T(T("تفاصيل العنوان (اختياري): الحي، الشارع، أقرب معلم...","Address details (optional): area, street, landmark..."),"Address details (optional): area, street, landmark...")} className="min-h-20 w-full rounded-xl border-2 px-4 py-3" />
        </section>

        <section className="space-y-3 rounded-3xl bg-card p-4 shadow-soft">
          <h2 className="font-bold">{T("طريقة الدفع","Payment method")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: "cash" as const, label: T("نقداً عند الاستلام","Cash on delivery"), Icon: Banknote },
              { k: "transfer" as const, label: T("تحويل مصرفي","Bank transfer"), Icon: Landmark },
            ].map(({ k, label, Icon }) => (
              <button key={k} onClick={() => setPayment(k)} className={cn("flex flex-col items-center gap-2 rounded-xl border-2 p-4 font-bold", payment === k ? "border-primary bg-accent text-primary" : "")}>
                <Icon className="h-7 w-7" />
                {label}
              </button>
            ))}
          </div>
          {payment === "transfer" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{T("اختر المصرف وحوّل المبلغ لأحد الحسابات التالية:","Choose a bank and transfer the amount to one of these accounts:")}</p>
              <BankList selected={bank} onSelect={setBank} />
              <p className="rounded-xl bg-secondary/30 p-3 text-sm font-bold">
                {T("بعد التحويل، تأكد من إرسال صورة الإيصال مع رقم الطلب لتأكيد الدفع.","After transferring, make sure to send the receipt with your order ID to confirm payment.")}
              </p>
            </div>
          )}
        </section>

        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder={T(T("ملاحظات الطلب (اختياري)","Order notes (optional)"),"Order notes (optional)")} className="min-h-16 w-full rounded-xl border-2 px-4 py-3" />

        <section className="space-y-2 rounded-2xl bg-accent p-4">
          <Row k={T(T("المجموع الجزئي","Subtotal"),"Subtotal")} v={money(cart.subtotal)} />
          <Row k={T(T("التوصيل","Delivery"),"Delivery")} v={city ? money(fee) : "—"} />
          <div className="border-t pt-2"><Row k={T(T("المجموع الكلي","Total"),"Total")} v={money(cart.subtotal + fee)} bold /></div>
        </section>
        <BrandButton disabled={busy} onClick={place}>{busy ? "..." : T(`اطلب الآن ${money(cart.subtotal + fee)}`,`Order now ${money(cart.subtotal + fee)}`)}</BrandButton>
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
