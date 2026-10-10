import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { money, PAYMENT_LABELS, STATUS_LABELS, STATUSES } from "@/lib/store";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["order_status"];

export function OrdersAdmin() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () =>
      (await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false })).data ?? [],
  });

  const update = async (id: string, patch: { status?: Status; admin_note?: string }) => {
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const list = (data ?? []).filter(
    (o) =>
      (filter === "all" || o.status === filter) &&
      (!q || String(o.order_number).includes(q) || o.phone.includes(q) || o.customer_name.includes(q)),
  );

  const exportCsv = () => {
    const rows = [["رقم", "الاسم", "الهاتف", "المدينة", "الدفع", "المصرف", "الحالة", "المجموع", "التاريخ"]];
    list.forEach((o) => rows.push([String(o.order_number), o.customer_name, o.phone, o.city, PAYMENT_LABELS[o.payment_method], o.bank ?? "", STATUS_LABELS[o.status], String(o.total), o.created_at]));
    const blob = new Blob(["\ufeff" + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "orders.csv";
    a.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث برقم الطلب / الهاتف / الاسم" className="flex-1 rounded-xl border-2 px-3 py-2" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border-2 bg-card px-3 py-2">
          <option value="all">كل الحالات</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <button onClick={exportCsv} className="rounded-xl border-2 border-primary px-3 py-2 font-bold text-primary">⬇️ تصدير Excel</button>
      </div>
      {list.length === 0 && <p className="text-muted-foreground">لا توجد طلبات</p>}
      {list.map((o) => (
        <div key={o.id} className="rounded-2xl border bg-card">
          <button onClick={() => setOpen(open === o.id ? null : o.id)} className="flex w-full items-center justify-between p-4 text-right">
            <div>
              <p className="font-extrabold">#{o.order_number} — {o.customer_name}</p>
              <p className="text-sm text-muted-foreground">{o.city} · {PAYMENT_LABELS[o.payment_method]} · {new Date(o.created_at).toLocaleString("ar-LY")}</p>
            </div>
            <div className="text-left">
              <p className="font-bold">{money(o.total)}</p>
              <span className="rounded-full bg-accent px-2 text-xs font-bold text-accent-foreground">{STATUS_LABELS[o.status]}</span>
              {o.payment_method === "transfer" && <p className="text-xs">{o.receipt_url ? "🧾 إيصال مرفق" : "⏳ بدون إيصال"}</p>}
            </div>
          </button>
          {open === o.id && (
            <div className="space-y-3 border-t p-4 text-sm">
              <p>📞 <a dir="ltr" href={`tel:${o.phone}`} className="font-bold text-primary">{o.phone}</a> · <a href={`https://wa.me/218${o.phone.slice(1)}`} target="_blank" rel="noreferrer" className="text-success underline">واتساب</a></p>
              <p>📍 {o.city}{o.address_details ? ` — ${o.address_details}` : ""}</p>
              {o.bank && <p>🏦 {o.bank}</p>}
              {o.notes && <p>📝 {o.notes}</p>}
              <div className="divide-y rounded-xl bg-muted p-2">
                {o.order_items.map((i) => (
                  <div key={i.id} className="flex justify-between py-1"><span>{i.name}{i.size ? ` (${i.size})` : ""} × {i.qty}</span><span>{money(Number(i.price) * i.qty)}</span></div>
                ))}
                <div className="flex justify-between py-1"><span>توصيل</span><span>{money(o.delivery_fee)}</span></div>
              </div>
              {o.receipt_url && (
                <a href={o.receipt_url} target="_blank" rel="noreferrer"><img src={o.receipt_url} alt="إيصال" className="max-h-64 rounded-xl border" /></a>
              )}
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => update(o.id, { status: s as Status })} className={`rounded-full border px-3 py-1 font-bold ${o.status === s ? "bg-primary text-primary-foreground" : ""}`}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              <NoteBox initial={o.admin_note} onSave={(v) => update(o.id, { admin_note: v })} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function NoteBox({ initial, onSave }: { initial: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(initial);
  return (
    <div className="flex gap-2">
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="ملاحظة داخلية للإدارة" className="flex-1 rounded-xl border-2 px-3 py-2" />
      <button onClick={() => onSave(v)} className="rounded-xl bg-primary px-4 font-bold text-primary-foreground">حفظ</button>
    </div>
  );
}
