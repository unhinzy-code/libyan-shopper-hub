import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Bell, Footprints, Heart, Lock, Package, Search, ShoppingBag, Wallet, type LucideIcon } from "lucide-react";

const EMPTY_ICONS: Record<string, LucideIcon> = { wallet: Wallet, bell: Bell, lock: Lock, heart: Heart, search: Search, shoe: Footprints, bag: ShoppingBag, package: Package };

/** Circular Libya flag (red / black with crescent & star / green). */
export function LibyaFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={cn("h-6 w-6 shrink-0 rounded-full shadow-sm", className)} aria-label="ليبيا">
      <clipPath id="ly-c"><circle cx="18" cy="18" r="18" /></clipPath>
      <g clipPath="url(#ly-c)">
        <rect width="36" height="9" fill="#E70013" />
        <rect y="9" width="36" height="18" fill="#000" />
        <rect y="27" width="36" height="9" fill="#239E46" />
        <circle cx="16.5" cy="18" r="5" fill="#fff" />
        <circle cx="18" cy="18" r="4" fill="#000" />
        <path d="M21.6 18l2.9-.95-1.8 2.47v-3.05l1.8 2.47z" fill="#fff" />
      </g>
    </svg>
  );
}

export function PhoneField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border-2 bg-card px-4 transition focus-within:border-primary focus-within:shadow-brand">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="tel"
        placeholder="رقم الهاتف 09XXXXXXXX"
        className="w-full bg-transparent py-3.5 outline-none"
      />
      <LibyaFlag />
    </div>
  );
}

/** Animated empty / logged-out state. */
export function EmptyState({
  emoji,
  title,
  text,
  action,
}: {
  emoji: string;
  title: string;
  text?: string | undefined;
  action?: { label: string; to: string; search?: Record<string, string> } | undefined;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-sm flex-col items-center py-14 text-center"
    >
      <div className="relative mb-6 flex h-36 w-36 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full bg-accent"
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 0.3, 0.7] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
        <motion.span
          className="absolute inset-4 rounded-full bg-secondary"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: 0.3 }}
        />
        <motion.span
          className="relative text-primary"
          animate={{ y: [0, -10, 0], rotate: [0, -6, 6, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {(() => { const I = EMPTY_ICONS[emoji] ?? ShoppingBag; return <I className="h-16 w-16" strokeWidth={1.6} />; })()}
        </motion.span>
      </div>
      <h2 className="text-xl font-extrabold">{title}</h2>
      {text && <p className="mt-2 text-muted-foreground">{text}</p>}
      {action && (
        <Link
          to={action.to}
          search={action.search as never}
          className="mt-6 rounded-full bg-brand px-8 py-3 font-bold text-primary-foreground shadow-brand transition active:scale-95"
        >
          {action.label}
        </Link>
      )}
    </motion.div>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <motion.h1 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="mb-4 text-2xl font-extrabold">
      {children}
    </motion.h1>
  );
}
