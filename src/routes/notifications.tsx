import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Bell } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StoreLayout } from "@/components/StoreLayout";
import { EmptyState, PageTitle } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "الإشعارات | کیوتی شوز" },
      { name: "description", content: "آخر التحديثات على طلباتك والعروض." },
      { property: "og:title", content: "الإشعارات | کیوتی شوز" },
      { property: "og:description", content: "آخر التحديثات والعروض." },
    ],
  }),
  component: Notifs,
});

function Notifs() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications", uid ?? "anon"],
    queryFn: async () => {
      let req = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
      req = uid ? req.or(`user_id.is.null,user_id.eq.${uid}`) : req.is("user_id", null);
      return (await req).data ?? [];
    },
  });
  useEffect(() => {
    if (!uid || !q.data?.some((n) => !n.read && n.user_id === uid)) return;
    supabase.from("notifications").update({ read: true }).eq("user_id", uid).eq("read", false).then(() => {
      qc.invalidateQueries({ queryKey: ["unread"] });
    });
  }, [uid, q.data, qc]);

  return (
    <StoreLayout>
      <div className="mx-auto max-w-xl">
        <PageTitle>الإشعارات</PageTitle>
        {q.isLoading ? null : !q.data?.length ? (
          <EmptyState emoji="bell" title="لا توجد إشعارات" text={session ? "سنخبرك فور تحديث طلبك" : "سجّل دخول لتصلك تحديثات طلباتك"} action={session ? undefined : { label: "دخول", to: "/auth" }} />
        ) : (
          <div className="space-y-2">
            {q.data.map((n, i) => {
              const body = (
                <div className="flex gap-3 rounded-2xl bg-card p-4 shadow-soft">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary"><Bell className="h-5 w-5" /></span>
                  <div className="flex-1">
                    <p className="font-bold">{n.title}</p>
                    {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString("ar-LY")}</p>
                  </div>
                  {!n.read && n.user_id && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />}
                </div>
              );
              return (
                <motion.div key={n.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  {n.link?.startsWith("/order/") ? <Link to="/order/$id" params={{ id: n.link.slice(7) }}>{body}</Link> : body}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
