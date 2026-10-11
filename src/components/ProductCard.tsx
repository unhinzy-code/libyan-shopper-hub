import { T } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { Footprints } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Heart, Plus, Star, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { money } from "@/lib/store";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { buzz } from "@/lib/haptics";
import { cn } from "@/lib/utils";

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
  rating?: number;
};

export function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  const off = p.old_price && p.old_price > p.price ? Math.round((1 - p.price / p.old_price) * 100) : 0;
  const fav = useFavorites();
  const cart = useCart();
  const liked = fav.ids.has(p.id);
  const [burst, setBurst] = useState(0);
  const [added, setAdded] = useState(false);
  const rating = Number(p.rating ?? 4.5).toFixed(1);

  const onHeart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    buzz(20);
    const now = await fav.toggle(p.id);
    if (now) setBurst((b) => b + 1);
  };
  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    buzz(20);
    if (p.stock <= 0) return toast.error(T("نفذت الكمية","Out of stock"));
    if (p.sizes.length) {
      toast(T(T("اختر المقاس أولاً","Choose a size first"),"Choose a size first"));
      return;
    }
    cart.add({ product_id: p.id, name: p.name, price: Number(p.price), image_url: p.image_url, size: "", qty: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: (index % 4) * 0.06, duration: 0.4 }}
      whileTap={{ scale: 0.97 }}
    >
      <Link to="/product/$id" params={{ id: p.id }} onClick={() => buzz()} className="group block overflow-hidden rounded-3xl bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-brand">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
          ) : (
            <div className="flex h-full items-center justify-center"><Footprints className="h-12 w-12 text-primary/40" /></div>
          )}
          {off > 0 && (
            <span className="absolute right-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">-{off}%</span>
          )}
          <button aria-label={T(T("مفضلة","Favorite"),"Favorite")} onClick={onHeart} className="absolute left-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 shadow-soft backdrop-blur">
            <motion.span key={liked ? "on" : "off"} initial={{ scale: 0.4 }} animate={{ scale: [0.4, 1.35, 1] }} transition={{ duration: 0.4 }}>
              <Heart className={cn("h-5 w-5", liked ? "fill-primary text-primary" : "text-foreground")} />
            </motion.span>
            <AnimatePresence>
              {burst > 0 && (
                <motion.span key={burst} className="pointer-events-none absolute inset-0 rounded-full border-2 border-primary" initial={{ scale: 0.6, opacity: 1 }} animate={{ scale: 2, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} />
              )}
            </AnimatePresence>
          </button>
          <button aria-label={T(T("أضف للسلة","Add to cart"),"Add to cart")} onClick={onAdd} className="absolute bottom-2 left-2 flex h-9 w-9 items-center justify-center rounded-full bg-brand text-primary-foreground shadow-brand">
            <AnimatePresence mode="wait">
              <motion.span key={added ? "y" : "n"} initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0 }}>
                {added ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </motion.span>
            </AnimatePresence>
          </button>
          {p.stock <= 0 && <span className="absolute inset-x-0 bottom-0 bg-foreground/70 py-1 text-center text-xs text-background">{T("نفذت الكمية","Out of stock")}</span>}
        </div>
        <div className="space-y-1 p-3">
          <h3 className="line-clamp-1 text-sm font-bold">{p.name}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-star text-star" />
            <span className="font-bold text-foreground">{rating}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="font-extrabold text-primary">{money(p.price)}</span>
            {off > 0 && <span className="text-xs text-muted-foreground line-through">{money(p.old_price)}</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
