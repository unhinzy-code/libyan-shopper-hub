import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ShoppingBag, User, Package, Shield } from "lucide-react";
import type { ReactNode } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { STORE_NAME } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-2xl font-extrabold text-primary", className)}>
      {STORE_NAME}
    </span>
  );
}

export function StoreLayout({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const { session, isAdmin } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const nav = [
    { to: "/", label: "الرئيسية", icon: Home },
    { to: "/cart", label: "السلة", icon: ShoppingBag, badge: count },
    { to: "/orders", label: "طلباتي", icon: Package },
    ...(isAdmin ? [{ to: "/admin", label: "الإدارة", icon: Shield }] : []),
    { to: session ? "/account" : "/auth", label: "الحساب", icon: User },
  ] as const;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="hidden gap-6 md:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "text-sm font-bold text-muted-foreground hover:text-primary",
                  path === n.to && "text-primary",
                )}
              >
                {n.label}
                {"badge" in n && n.badge ? ` (${n.badge})` : ""}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card md:hidden">
        <div className="flex justify-around py-2">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = path === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-2 text-xs",
                  active ? "font-bold text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-6 w-6" />
                {n.label}
                {"badge" in n && n.badge ? (
                  <span className="absolute -top-1 right-0 rounded-full bg-destructive px-1.5 text-[10px] text-destructive-foreground">
                    {n.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function BrandButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "w-full rounded-xl bg-brand py-3.5 text-lg font-bold text-primary-foreground shadow-brand transition active:scale-[0.99] disabled:opacity-60",
        className,
      )}
    />
  );
}
