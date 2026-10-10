import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StoreLayout } from "@/components/StoreLayout";
import { useAuth } from "@/lib/auth";
import { money, STATUS_LABELS } from "@/lib/store";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "طلباتي | کیوتی شوز" },
      { name: "description", content: "تابع حالة طلباتك في کیوتی شوز." },
      { property: "og:title", content: "طلباتي | کیوتی شوز" },
      { property: "og:description", content: "تابع حالة طلباتك." },
    ],
  }),
  component: Orders,
});

function Orders() {
  const { session, loading } = useAuth();
  const { data } = useQuery({
    queryKey: ["my-orders", session?.user.id],
    enabled: !!session,
    queryFn: async () =>
      (await supabase.from("orders").select("*").eq("user_id", session!.user.id).order("created_at", { ascending: false })).data ?? [],
  });
  if (!loading && !session)
    return <StoreLayout><Link to="/auth" search={{ next: "/orders" }} className="font-bold text-primary underline">سجل دخول لعرض طلباتك</Link></StoreLayout>;
  return (
    <StoreLayout>
      <h1 className="mb-4 text-2xl font-extrabold">طلباتي</h1>
      {data?.length === 0 && <p className="text-muted-foreground">ما عندك طلبات بعد</p>}
      <div className="space-y-3">
        {data?.map((o) => (
          <Link key={o.id} to="/order/$id" params={{ id: o.id }} className="flex items-center justify-between rounded-2xl border bg-card p-4">
            <div>
              <p className="font-extrabold">#{o.order_number}</p>
              <p className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ar-LY")}</p>
            </div>
            <div className="text-left">
              <p className="font-bold">{money(o.total)}</p>
              <span className="rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-accent-foreground">{STATUS_LABELS[o.status]}</span>
            </div>
          </Link>
        ))}
      </div>
    </StoreLayout>
  );
}
