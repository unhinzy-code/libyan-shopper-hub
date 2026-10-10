import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StoreLayout } from "@/components/StoreLayout";
import { BankList } from "@/components/BankList";
import { useAuth } from "@/lib/auth";
import { money, PAYMENT_LABELS, STATUS_LABELS } from "@/lib/store";
import { uploadImage } from "@/lib/upload";

export const Route = createFileRoute("/order/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل الطلب | کیوتی شوز" },
      { name: "description", content: "حالة طلبك وتفاصيل الدفع." },
      { property: "og:title", content: "تفاصيل الطلب | کیوتی شوز" },
      { property: "og:description", content: "حالة طلبك وتفاصيل الدفع." },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const { session } = useAuth();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const { data: o, isLoading } = useQuery({
    queryKey: ["order", id],
    enabled: !!session,
    queryFn: async () =>
      (await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle()).data,
  });

  if (!session) return <StoreLayout><Link to="/auth" className="text-primary underline">سجل دخول</Link></StoreLayout>;
  if (isLoading) return <StoreLayout><p>جاري التحميل...</p></StoreLayout>;
  if (!o) return <StoreLayout><p>الطلب غير موجود</p></StoreLayout>;

  const onFile = async (f?: File) => {
    if (!f) return;
    setUploading(true);
    try {
      const url = await uploadImage("receipts", session.user.id, f);
      const { error } = await supabase.rpc("attach_receipt", { _order_id: o.id, _url: url });
      if (error) throw error;
      toast.success("تم إرسال الإيصال ✅");
      qc.invalidateQueries({ queryKey: ["order", id] });
    } catch (e) {
      toast.error((e as Error).message);
    }
    setUploading(false);
  };

  return (
    <StoreLayout>
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-3xl bg-brand p-6 text-center text-primary-foreground">
          <p className="text-lg">رقم طلبك</p>
          <p className="font-display text-5xl font-extrabold">#{o.order_number}</p>
          <p className="mt-2 inline-block rounded-full bg-card/25 px-4 py-1 font-bold">{STATUS_LABELS[o.status]}</p>
        </div>

        {o.payment_method === "transfer" && (
          <div className="space-y-3 rounded-2xl border-2 border-secondary bg-card p-4">
            <h2 className="font-extrabold">💳 الدفع بالتحويل</h2>
            <p>حوّل مبلغ <b>{money(o.total)}</b> إلى:</p>
            <BankList selected={o.bank} />
            <p className="rounded-xl bg-secondary/30 p-3 font-bold">
              ⚠️ تأكد من إرسال صورة الإيصال مع رقم الطلب <b>#{o.order_number}</b> لتأكيد أنك دفعت.
            </p>
            {o.receipt_url ? (
              <p className="font-bold text-success">✅ تم استلام الإيصال، سيتم المراجعة قريباً</p>
            ) : (
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-primary p-4 text-center font-bold text-primary">
                {uploading ? "جاري الرفع..." : "📎 ارفع صورة الإيصال"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
            )}
          </div>
        )}

        <div className="space-y-2 rounded-2xl border bg-card p-4">
          <p><b>الدفع:</b> {PAYMENT_LABELS[o.payment_method]}</p>
          <p><b>المدينة:</b> {o.city}{o.address_details ? ` — ${o.address_details}` : ""}</p>
          <div className="divide-y border-t pt-2">
            {o.order_items.map((i) => (
              <div key={i.id} className="flex justify-between py-2 text-sm">
                <span>{i.name}{i.size ? ` (${i.size})` : ""} × {i.qty}</span>
                <span>{money(Number(i.price) * i.qty)}</span>
              </div>
            ))}
          </div>
          <p className="flex justify-between"><span>التوصيل</span><span>{money(o.delivery_fee)}</span></p>
          <p className="flex justify-between text-lg font-extrabold"><span>المجموع</span><span>{money(o.total)}</span></p>
        </div>
        <Link to="/orders" className="block text-center font-bold text-primary underline">كل طلباتي</Link>
      </div>
    </StoreLayout>
  );
}
