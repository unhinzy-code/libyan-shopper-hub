import { Link } from "@tanstack/react-router";
import { money } from "@/lib/store";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  old_price: number | null;
  stock: number;
  sizes: string[];
  image_url: string | null;
  category_id: string | null;
  featured: boolean;
  active: boolean;
  created_at: string;
};

export function ProductCard({ p }: { p: Product }) {
  const off = p.old_price && p.old_price > p.price ? Math.round((1 - p.price / p.old_price) * 100) : 0;
  return (
    <Link
      to="/product/$id"
      params={{ id: p.id }}
      className="group overflow-hidden rounded-2xl border bg-card transition hover:shadow-brand"
    >
      <div className="relative aspect-square bg-muted">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">👟</div>
        )}
        {p.stock <= 0 && (
          <span className="absolute inset-x-0 bottom-0 bg-foreground/70 py-1 text-center text-xs text-background">
            نفذت الكمية
          </span>
        )}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-sm font-bold">{p.name}</h3>
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-primary">{money(p.price)}</span>
          {off > 0 && (
            <>
              <span className="text-xs text-muted-foreground line-through">{money(p.old_price)}</span>
              <span className="rounded-full bg-destructive/10 px-2 text-xs font-bold text-destructive">-{off}%</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
