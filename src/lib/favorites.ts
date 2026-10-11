import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useFavorites() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const uid = session?.user.id;
  const q = useQuery({
    queryKey: ["favorites", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("product_id").eq("user_id", uid!);
      return new Set((data ?? []).map((r) => r.product_id));
    },
  });
  const ids = q.data ?? new Set<string>();
  const toggle = async (productId: string) => {
    if (!uid) {
      toast("سجّل دخول لحفظ المفضلة ");
      navigate({ to: "/auth", search: {} });
      return false;
    }
    const has = ids.has(productId);
    const next = new Set(ids);
    if (has) next.delete(productId);
    else next.add(productId);
    qc.setQueryData(["favorites", uid], next);
    const { error } = has
      ? await supabase.from("favorites").delete().eq("user_id", uid).eq("product_id", productId)
      : await supabase.from("favorites").insert({ user_id: uid, product_id: productId });
    if (error) {
      qc.setQueryData(["favorites", uid], ids);
      toast.error("تعذر الحفظ");
    }
    return !has;
  };
  return { ids, toggle, count: ids.size };
}
