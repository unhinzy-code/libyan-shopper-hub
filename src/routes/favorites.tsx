import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StoreLayout } from "@/components/StoreLayout";
import { ProductCard, type Product } from "@/components/ProductCard";
import { EmptyState, PageTitle } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "المفضلة | کیوتی شوز" },
      { name: "description", content: "الأحذية التي أعجبتك في کیوتی شوز." },
      { property: "og:title", content: "المفضلة | کیوتی شوز" },
      { property: "og:description", content: "الأحذية التي أعجبتك." },
    ],
  }),
  component: Favs,
});

function Favs() {
  const { session } = useAuth();
  const fav = useFavorites();
  const ids = [...fav.ids];
  const q = useQuery({
    queryKey: ["fav-products", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => ((await supabase.from("products").select("*").in("id", ids)).data ?? []) as Product[],
  });
  return (
    <StoreLayout>
      <PageTitle>المفضلة 💗</PageTitle>
      {!session ? (
        <EmptyState emoji="🔒" title="سجّل دخول أولاً" text="احفظ الأحذية اللي تعجبك وارجع لها بأي وقت" action={{ label: "دخول", to: "/auth" }} />
      ) : ids.length === 0 ? (
        <EmptyState emoji="💔" title="ما فيه مفضلة بعد" text="اضغط على القلب في أي منتج ليظهر هنا" action={{ label: "تسوق الآن", to: "/" }} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {(q.data ?? []).map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
        </div>
      )}
    </StoreLayout>
  );
}
