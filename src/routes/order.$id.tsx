import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Clock, Package, Truck, Home, X } from "lucide-react";
import { EmptyState } from "@/components/ui-kit";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StoreLayout } from "@/components/StoreLayout";
import { BankList } from "@/components/BankList";
import { useAuth } from "@/lib/auth";
import { money, PAYMENT_LABELS, STATUS_LABELS } from "@/lib/store";
import { uploadImage } from "@/lib/upload";

export const Route = createFileRoute("/order/$id")({
  validateSearch: (s: Record<string, unknown>): { placed?: boolean | undefined } => ({ placed: s.placed === true || s.placed === "true" ? true : undefined }),
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
  const { placed } = Route.useSearch();
  const [celebrate, setCelebrate] = useState(!!placed);
  useEffect(() => {
    if (!placed) return;
    buzz(80);
    const t = setTimeout(() => setCelebrate(false), 3200);
    return () => clearTimeout(t);
  }, [placed]);
  const { data: o, isLoading } = useQuery({
    queryKey: ["order", id],
    enabled: !!session,
    queryFn: async () =>
      (await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle()).data,
  });

  if (!session) return <StoreLayout><EmptyState emoji="🔐" title="سجّل دخول لرؤية الطلب" action={{ label: "دخول", to: "/auth" }} /></StoreLayout>;
  if (isLoading) return <StoreLayout><p>جاري التحميل...</p></StoreLayout>;
  if (!o) return <StoreLayout><EmptyState emoji="🔎" title="الطلب غير موجود" action={{ label: "طلباتي", to: "/orders" }} /></StoreLayout>;

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
      <AnimatePresence>{celebrate && <Success n={o.order_number} onClose={() => setCelebrate(false)} />}</AnimatePresence>
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-3xl bg-brand p-6 text-center text-primary-foreground">
          <p className="text-lg">رقم طلبك</p>
          <p className="font-display text-5xl font-extrabold">#{o.order_number}</p>
          <p className="mt-2 inline-block rounded-full bg-card/25 px-4 py-1 font-bold">{STATUS_LABELS[o.status]}</p>
        </div>
        <Tracker status={o.status} />

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

const STEPS = [
  { k: "pending", label: "تم الاستلام", Icon: Clock },
  { k: "confirmed", label: "مؤكد", Icon: Check },
  { k: "processing", label: "تجهيز", Icon: Package },
  { k: "shipped", label: "في الطريق", Icon: Truck },
  { k: "delivered", label: "تم التوصيل", Icon: Home },
];

function Tracker({ status }: { status: string }) {
  if (status === "cancelled")
    return <div className="flex items-center gap-2 rounded-3xl bg-destructive/10 p-4 font-bold text-destructive"><X className="h-5 w-5" /> تم إلغاء هذا الطلب</div>;
  const idx = STEPS.findIndex((s) => s.k === status);
  return (
    <div className="rounded-3xl bg-card p-5 shadow-soft">
      <h2 className="mb-4 font-extrabold">تتبع الطلب</h2>
      <div className="relative flex justify-between">
        <div className="absolute inset-x-5 top-5 h-1 rounded bg-muted" />
        <motion.div className="absolute right-5 top-5 h-1 rounded bg-brand" initial={{ width: 0 }} animate={{ width: `calc(${(idx / (STEPS.length - 1)) * 100}% - ${(idx / (STEPS.length - 1)) * 2.5}rem)` }} transition={{ duration: 1, ease: "easeOut" }} />
        {STEPS.map((s, i) => (
          <div key={s.k} className="relative z-10 flex w-14 flex-col items-center gap-1.5">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15 * i, type: "spring" }}
              className={i <= idx ? "flex h-10 w-10 items-center justify-center rounded-full bg-brand text-primary-foreground shadow-brand" : "flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"}
            >
              <s.Icon className="h-5 w-5" />
            </motion.span>
            {i === idx && <motion.span className="absolute top-0 h-10 w-10 rounded-full border-2 border-primary" animate={{ scale: [1, 1.5], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 1.4 }} />}
            <span className={i <= idx ? "text-center text-[11px] font-bold text-primary" : "text-center text-[11px] text-muted-foreground"}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Success({ n, onClose }: { n: number; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-card/95 backdrop-blur">
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-3 w-3 rounded-full"
          style={{ background: i % 2 ? "var(--primary)" : "var(--primary-glow)" }}
          initial={{ x: 0, y: 0, scale: 0 }}
          animate={{ x: Math.cos((i / 18) * Math.PI * 2) * 160, y: Math.sin((i / 18) * Math.PI * 2) * 160, scale: [0, 1.2, 0] }}
          transition={{ duration: 1.2, delay: 0.3 }}
        />
      ))}
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 12 }} className="flex h-28 w-28 items-center justify-center rounded-full bg-brand shadow-brand">
        <svg viewBox="0 0 24 24" className="h-14 w-14" fill="none" stroke="var(--primary-foreground)" strokeWidth={3} strokeLinecap="round">
          <motion.path d="M5 12l5 5 9-10" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35, duration: 0.5 }} />
        </svg>
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-6 text-2xl font-extrabold">تم إرسال طلبك 🎉</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-2 text-muted-foreground">رقم الطلب #{n}</motion.p>
    </motion.div>
  );
}
