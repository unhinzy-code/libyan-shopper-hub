import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/store";

export function CustomersAdmin() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();
  const credit = async (id: string, cur: number) => {
    const v = prompt("رصيد المحفظة الجديد (د.ل)", String(cur));
    if (v === null || isNaN(Number(v))) return;
    const { error } = await supabase.from("profiles").update({ wallet_balance: Number(v) }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث الرصيد");
    qc.invalidateQueries({ queryKey: ["admin-customers"] });
  };
  const { data } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const [p, o] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("user_id,total,status"),
      ]);
      return (p.data ?? []).map((c) => {
        const mine = (o.data ?? []).filter((x) => x.user_id === c.id && x.status !== "cancelled");
        return { ...c, count: mine.length, spent: mine.reduce((a, x) => a + Number(x.total), 0) };
      });
    },
  });
  const list = (data ?? []).filter((c) => !q || c.name.includes(q) || c.phone.includes(q));
  return (
    <div className="space-y-3">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم أو الهاتف" className="w-full rounded-xl border-2 px-3 py-2" />
      <p className="text-sm text-muted-foreground">عدد الزبائن: {list.length}</p>
      {list.map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded-2xl border bg-card p-3">
          <div>
            <p className="font-bold">{c.name || "—"}</p>
            <div className="flex gap-2 text-sm">
              <a dir="ltr" href={`tel:${c.phone}`} className="text-primary">{c.phone}</a>
              <a href={`https://wa.me/218${c.phone.slice(1)}`} target="_blank" rel="noreferrer" className="font-bold text-success">واتساب</a>
            </div>
            <button onClick={() => credit(c.id, Number(c.wallet_balance))} className="mt-1 rounded-lg border px-2 text-xs">المحفظة: {money(c.wallet_balance)}</button>
          </div>
          <div className="text-left text-sm">
            <p>{c.count} طلبات</p>
            <p className="font-bold">{money(c.spent)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
