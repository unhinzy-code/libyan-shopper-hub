import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/store";

export function CustomersAdmin() {
  const [q, setQ] = useState("");
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
            <a dir="ltr" href={`tel:${c.phone}`} className="text-sm text-primary">{c.phone}</a>
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
