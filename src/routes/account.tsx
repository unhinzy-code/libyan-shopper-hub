import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { StoreLayout } from "@/components/StoreLayout";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "حسابي | کیوتی شوز" },
      { name: "description", content: "معلومات حسابك في کیوتی شوز." },
      { property: "og:title", content: "حسابي | کیوتی شوز" },
      { property: "og:description", content: "معلومات حسابك." },
    ],
  }),
  component: Account,
});

function Account() {
  const { profile, session, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  if (!session) return <StoreLayout><Link to="/auth" className="text-primary underline">سجل دخول</Link></StoreLayout>;
  return (
    <StoreLayout>
      <div className="mx-auto max-w-md space-y-4 rounded-3xl border bg-card p-6">
        <h1 className="text-2xl font-extrabold">أهلاً {profile?.name} 👋</h1>
        <p dir="ltr" className="text-right text-muted-foreground">{profile?.phone}</p>
        <Link to="/orders" className="block rounded-xl bg-muted p-3 font-bold">📦 طلباتي</Link>
        {isAdmin && <Link to="/admin" className="block rounded-xl bg-accent p-3 font-bold text-primary">🛡️ لوحة الإدارة</Link>}
        <button
          onClick={async () => {
            await qc.cancelQueries();
            qc.clear();
            await signOut();
            navigate({ to: "/auth", search: { next: undefined }, replace: true });
          }}
          className="w-full rounded-xl border-2 border-destructive py-3 font-bold text-destructive"
        >
          تسجيل خروج
        </button>
      </div>
    </StoreLayout>
  );
}
