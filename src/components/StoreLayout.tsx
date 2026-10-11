import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Bell, Heart, Home, Package, Search, ShoppingBag, User, X } from "lucide-react";
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

/** `overHero`: top bar starts transparent over a full-bleed hero and fades to white on scroll. */
export function StoreLayout({ children, overHero = false }: { children: ReactNode; overHero?: boolean }) {
  const { count } = useCart();
  const { isAdmin } = useAuth();
  const fav = useFavorites();
  const unread = useUnread();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [scrollT, setScrollT] = useState(overHero ? 0 : 1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!overHero) return setScrollT(1);
    const on = () => setScrollT(Math.min(1, window.scrollY / 260));
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [overHero]);

  const solid = scrollT > 0.6;
  const iconBtn = cn(
    "relative flex h-10 w-10 items-center justify-center rounded-full transition",
    solid ? "text-foreground hover:bg-muted" : "bg-card/30 text-foreground backdrop-blur-sm",
  );

  const nav = [
    { to: "/", label: "الرئيسية", icon: Home },
    { to: "/cart", label: "السلة", icon: ShoppingBag, badge: count },
    { to: "/orders", label: "طلباتي", icon: Package },
    { to: "/account", label: "حسابي", icon: User },
  ] as const;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    buzz();
    setSearchOpen(false);
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
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
          <Link to="/" onClick={() => buzz()}>
            <Logo />
          </Link>
          <nav className="hidden gap-6 md:flex">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => buzz()} className={cn("text-sm font-bold text-muted-foreground transition hover:text-primary", path === n.to && "text-primary")}>
                {n.label}
              </Link>
            ))}
            {isAdmin && <Link to="/admin" className="text-sm font-bold text-primary">الإدارة</Link>}
          </nav>
          <div className="flex items-center gap-1">
            <button aria-label="بحث" className={iconBtn} onClick={() => { buzz(); setSearchOpen(true); }}>
              <Search className="h-5 w-5" />
            </button>
            <Link to="/notifications" aria-label="الإشعارات" className={iconBtn} onClick={() => buzz()}>
              <Bell className="h-5 w-5" />
              <Badge n={unread} />
            </Link>
            <Link to="/favorites" aria-label="المفضلة" className={iconBtn} onClick={() => buzz()}>
              <Heart className="h-5 w-5" />
              <Badge n={fav.count} />
            </Link>
          </div>
        </div>
        <AnimatePresence>
          {searchOpen && (
            <motion.form
              onSubmit={submitSearch}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="absolute inset-x-0 top-0 flex h-16 items-center gap-2 bg-card px-4 shadow-soft"
            >
              <Search className="h-5 w-5 text-primary" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن حذاء..." className="h-11 flex-1 rounded-full bg-muted px-4 outline-none" />
              <button type="button" aria-label="إغلاق" onClick={() => setSearchOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </header>

      <motion.main
        key={path}
        initial={{ opacity: 0, y: 14 }}
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
            const active = path === n.to;
            return (
              <Link key={n.to} to={n.to} onClick={() => buzz()} className={cn("relative flex w-16 flex-col items-center gap-0.5 py-1 text-[11px]", active ? "font-bold text-primary" : "text-muted-foreground")}>
                {active && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-2xl bg-accent" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
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
