import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Bell, Heart, Home, LayoutGrid, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";
import { buzz } from "@/lib/haptics";
import { STORE_NAME } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return <span className={cn("font-display text-2xl font-extrabold text-primary", className)}>{STORE_NAME}</span>;
}

function useUnread() {
  const { session } = useAuth();
  const uid = session?.user.id;
  return (
    useQuery({
      queryKey: ["unread", uid],
      enabled: !!uid,
      refetchInterval: 30000,
      queryFn: async () =>
        (await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", uid!).eq("read", false))
          .count ?? 0,
    }).data ?? 0
  );
}

function Badge({ n }: { n: number }) {
  return (
    <AnimatePresence>
      {n > 0 && (
        <motion.span
          key={n}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
        >
          {n > 99 ? "99+" : n}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// Skip the enter animation on the very first (hydrated) render so the first page never flickers.
let hasNavigated = false;

/** `overHero`: top bar starts transparent over a full-bleed hero and fades to white on scroll. */
export function StoreLayout({ children, overHero = false }: { children: ReactNode; overHero?: boolean }) {
  const { count } = useCart();
  const { isAdmin } = useAuth();
  const fav = useFavorites();
  const unread = useUnread();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [scrollT, setScrollT] = useState(overHero ? 0 : 1);
  const [q, setQ] = useState("");
  const [animate] = useState(() => hasNavigated);
  useEffect(() => { hasNavigated = true; }, []);

  useEffect(() => {
    if (!overHero) return setScrollT(1);
    const on = () => setScrollT(Math.min(1, window.scrollY / 260));
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [overHero]);

  const solid = scrollT > 0.6;
  const iconBtn = cn(
    "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition",
    solid ? "text-foreground hover:bg-muted" : "bg-card/30 text-foreground backdrop-blur-sm",
  );

  const nav = [
    { to: "/", label: "الرئيسية", icon: Home },
    { to: "/categories", label: "الأقسام", icon: LayoutGrid },
    { to: "/cart", label: "السلة", icon: ShoppingBag, badge: count },
    { to: "/account", label: "حسابي", icon: User },
  ] as const;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    buzz();
    navigate({ to: "/", search: { q: q.trim() || undefined } });
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <header
        className={cn("z-40 w-full", overHero ? "fixed top-0" : "sticky top-0")}
        style={{
          backgroundColor: `color-mix(in oklab, var(--card) ${Math.round(scrollT * 100)}%, transparent)`,
          boxShadow: scrollT > 0.95 ? "var(--shadow-soft)" : "none",
          backdropFilter: scrollT > 0.1 ? `blur(${scrollT * 12}px)` : undefined,
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-3">
          <Link to="/" onClick={() => buzz()} className="hidden md:block">
            <Logo />
          </Link>
          <nav className="hidden gap-5 md:flex">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => buzz()} className={cn("text-sm font-bold text-muted-foreground transition hover:text-primary", path === n.to && "text-primary")}>
                {n.label}
              </Link>
            ))}
            {isAdmin && <Link to="/admin" className="text-sm font-bold text-primary">الإدارة</Link>}
          </nav>
          <form onSubmit={submitSearch} className="flex-1">
            <label
              className={cn(
                "flex h-11 w-full items-center gap-2 rounded-full px-4 transition-colors duration-300 focus-within:ring-2 focus-within:ring-primary/40",
                solid ? "bg-muted" : "bg-card/70 backdrop-blur-md",
              )}
            >
              <Search className="h-5 w-5 shrink-0 text-primary" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن حذاء..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              {q && (
                <button type="button" aria-label="مسح" onClick={() => setQ("")} className="text-muted-foreground"><X className="h-4 w-4" /></button>
              )}
            </label>
          </form>
          <Link to="/notifications" aria-label="الإشعارات" className={iconBtn} onClick={() => buzz()}>
            <Bell className="h-5 w-5" />
            <Badge n={unread} />
          </Link>
          <Link to="/favorites" aria-label="المفضلة" className={iconBtn} onClick={() => buzz()}>
            <Heart className="h-5 w-5" />
            <Badge n={fav.count} />
          </Link>
        </div>
      </header>

      <motion.main
        key={path}
        initial={animate ? { opacity: 0, y: 14 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(!overHero && "mx-auto max-w-6xl px-4 py-5")}
      >
        {children}
      </motion.main>

      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-3xl border bg-card/95 shadow-soft backdrop-blur md:hidden">
        <div className="flex justify-around py-2">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} onClick={() => buzz()} className={cn("relative flex w-16 flex-col items-center gap-0.5 py-1 text-[11px]", active ? "font-bold text-primary" : "text-muted-foreground")}>
                {active && <motion.span initial={animate ? { scale: 0.6, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 rounded-2xl bg-accent" transition={{ type: "spring", stiffness: 400, damping: 26 }} />}
                <span className="relative">
                  <Icon className="h-6 w-6" />
                  {"badge" in n && <Badge n={n.badge} />}
                </span>
                <span className="relative">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function BrandButton({ className, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      onClick={(e) => {
        buzz();
        onClick?.(e);
      }}
      className={cn(
        "w-full rounded-2xl bg-brand py-3.5 text-lg font-bold text-primary-foreground shadow-brand transition hover:brightness-105 active:scale-[0.97] disabled:opacity-60",
        className,
      )}
    />
  );
}
