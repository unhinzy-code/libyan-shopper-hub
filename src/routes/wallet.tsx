import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { StoreLayout } from "@/components/StoreLayout";
import { EmptyState, PageTitle } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/store";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "المحفظة | کیوتی شوز" },
      { name: "description", content: "رصيد محفظتك في کیوتی شوز." },
      { property: "og:title", content: "المحفظة | کیوتی شوز" },
      { property: "og:description", content: "رصيد محفظتك." },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const { session } = useAuth();
  const q = useQuery({
    queryKey: ["wallet", session?.user.id],
    enabled: !!session,
    queryFn: async () => (await supabase.from("profiles").select("wallet_balance").eq("id", session!.user.id).maybeSingle()).data?.wallet_balance ?? 0,
  });
  return (
    <StoreLayout>
      <div className="mx-auto max-w-md">
        <PageTitle>المحفظة</PageTitle>
        {!session ? (
          <EmptyState emoji="👛" title="سجّل دخول لرؤية رصيدك" action={{ label: "دخول", to: "/auth" }} />
        ) : (
          <motion.div initial={{ rotateX: 30, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ type: "spring" }} className="rounded-3xl bg-brand p-8 text-primary-foreground shadow-brand">
            <p className="opacity-90">رصيدك الحالي</p>
            <p className="mt-2 font-display text-5xl font-extrabold">{money(q.data)}</p>
            <p className="mt-6 text-sm opacity-90">رصيد من المتجر (مرتجعات وهدايا). تواصل معنا لاستخدامه في طلبك القادم.</p>
          </motion.div>
        )}
      </div>
    </StoreLayout>
  );
}
