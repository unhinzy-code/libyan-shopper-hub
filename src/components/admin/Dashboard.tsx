import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { money, STATUS_LABELS } from "@/lib/store";

export function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin-dash"],
    queryFn: async () => {
      const [o, p, c] = await Promise.all([
        supabase.from("orders").select("total,status,created_at,payment_method,receipt_url"),
        supabase.from("products").select("id,name,stock").order("stock").limit(200),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      return { orders: o.data ?? [], products: p.data ?? [], customers: c.count ?? 0 };
    },
  });
  if (!data) return <p>...</p>;
  const valid = data.orders.filter((o) => o.status !== "cancelled");
  const today = new Date().toDateString();
  const todays = data.orders.filter((o) => new Date(o.created_at).toDateString() === today);
  const revenue = data.orders.filter((o) => o.status === "delivered").reduce((a, o) => a + Number(o.total), 0);
  const pendingReceipts = data.orders.filter((o) => o.payment_method === "transfer" && o.receipt_url && o.status === "pending").length;
  const low = data.products.filter((p) => p.stock < 5);

  const cards = [
    ["كل الطلبات", valid.length],
    ["طلبات اليوم", todays.length],
    ["الإيرادات (المسلّمة)", money(revenue)],
    ["الزبائن", data.customers],
    ["إيصالات بانتظار المراجعة", pendingReceipts],
    ["المنتجات", data.products.length],
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map(([k, v]) => (
          <div key={k as string} className="rounded-2xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{k}</p>
            <p className="text-2xl font-extrabold text-primary">{v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-card p-4">
        <h3 className="mb-2 font-bold">الطلبات حسب الحالة</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_LABELS).map(([k, l]) => (
            <span key={k} className="rounded-full bg-muted px-3 py-1 text-sm">{l}: <b>{data.orders.filter((o) => o.status === k).length}</b></span>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border bg-card p-4">
        <h3 className="mb-2 font-bold">مخزون منخفض (أقل من 5)</h3>
        {low.length === 0 ? <p className="text-sm text-muted-foreground">كل شي تمام</p> : (
          <ul className="space-y-1 text-sm">
            {low.map((p) => <li key={p.id} className="flex justify-between"><span>{p.name}</span><b className="text-destructive">{p.stock}</b></li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
