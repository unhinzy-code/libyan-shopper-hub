import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { CheckCircle2, ChevronLeft, Clock, PackageCheck, Truck, XCircle, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StoreLayout } from "@/components/StoreLayout";
import { EmptyState, PageTitle } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth";
import { buzz } from "@/lib/haptics";
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

const STATUS_ICON: Record<string, LucideIcon> = {
  pending: Clock,
  confirmed: CheckCircle2,
  shipped: Truck,
  delivered: PackageCheck,
  cancelled: XCircle,
};

function Orders() {
  const { session, loading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", session?.user.id],
    enabled: !!session,
    queryFn: async () =>
      (await supabase.from("orders").select("*").eq("user_id", session!.user.id).order("created_at", { ascending: false })).data ?? [],
  });
  if (!loading && !session)
    return (
      <StoreLayout>
        <EmptyState emoji="lock" title="سجّل دخول لعرض طلباتك" action={{ label: "دخول", to: "/auth", search: { next: "/orders" } }} />
      </StoreLayout>
    );
  return (
    <StoreLayout>
      <div className="mx-auto max-w-md">
        <PageTitle>طلباتي</PageTitle>
        {isLoading && <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-3xl bg-muted" />)}</div>}
        {data?.length === 0 && <EmptyState emoji="package" title="ما عندك طلبات بعد" text="ابدأ التسوق وطلباتك تظهر هنا" action={{ label: "تسوق الآن", to: "/" }} />}
        <div className="space-y-3">
          {data?.map((o, i) => {
            const Icon = STATUS_ICON[o.status] ?? Clock;
            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 24 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link to="/order/$id" params={{ id: o.id }} onClick={() => buzz()} className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-soft">
                  <motion.span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary"
                    animate={o.status === "shipped" ? { x: [0, -4, 0] } : o.status === "pending" ? { rotate: [0, 10, -10, 0] } : {}}
                    transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1 }}
                  >
                    <Icon className="h-6 w-6" />
                  </motion.span>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold">#{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ar-LY")}</p>
                    <span className="mt-1 inline-block rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-accent-foreground">{STATUS_LABELS[o.status]}</span>
                  </div>
                  <p className="font-extrabold text-primary">{money(o.total)}</p>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </StoreLayout>
  );
}
