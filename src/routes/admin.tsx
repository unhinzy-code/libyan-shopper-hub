import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { StoreLayout } from "@/components/StoreLayout";
import { useAuth } from "@/lib/auth";
import { Dashboard } from "@/components/admin/Dashboard";
import { OrdersAdmin } from "@/components/admin/OrdersAdmin";
import { ProductsAdmin } from "@/components/admin/ProductsAdmin";
import { CategoriesAdmin, CitiesAdmin, NotificationsAdmin } from "@/components/admin/SimpleAdmins";
import { CustomersAdmin } from "@/components/admin/CustomersAdmin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة الإدارة | کیوتی شوز" },
      { name: "description", content: "إدارة الطلبات والمنتجات والأقسام." },
      { property: "og:title", content: "لوحة الإدارة | کیوتی شوز" },
      { property: "og:description", content: "إدارة المتجر." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const TABS = [
  ["dash", "📊 الإحصائيات"],
  ["orders", "📦 الطلبات"],
  ["products", "👟 المنتجات"],
  ["cats", "🗂️ الأقسام"],
  ["cities", "📍 المدن والتوصيل"],
  ["customers", "👥 الزبائن"],
  ["notifs", "🔔 الإشعارات"],
] as const;

function Admin() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("dash");
  if (loading) return <StoreLayout><p>...</p></StoreLayout>;
  if (!isAdmin)
    return <StoreLayout><p>هذه الصفحة للإدارة فقط. <Link to="/auth" className="text-primary underline">دخول</Link></p></StoreLayout>;
  return (
    <StoreLayout>
      <h1 className="mb-4 text-2xl font-extrabold">لوحة الإدارة</h1>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-bold", tab === k ? "bg-primary text-primary-foreground" : "bg-card")}>
            {l}
          </button>
        ))}
      </div>
      {tab === "dash" && <Dashboard />}
      {tab === "orders" && <OrdersAdmin />}
      {tab === "products" && <ProductsAdmin />}
      {tab === "cats" && <CategoriesAdmin />}
      {tab === "cities" && <CitiesAdmin />}
      {tab === "customers" && <CustomersAdmin />}
      {tab === "notifs" && <NotificationsAdmin />}
    </StoreLayout>
  );
}
