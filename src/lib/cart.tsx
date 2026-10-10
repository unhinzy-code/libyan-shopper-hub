import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  product_id: string;
  name: string;
  price: number;
  image_url: string | null;
  size: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  add: (item: CartItem) => void;
  setQty: (product_id: string, size: string, qty: number) => void;
  remove: (product_id: string, size: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const Ctx = createContext<CartState | null>(null);
const KEY = "cuteshoes-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {
      /* ignore */
    }
  }, []);
  const save = (next: CartItem[]) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };
  const same = (a: CartItem, id: string, size: string) => a.product_id === id && a.size === size;

  return (
    <Ctx.Provider
      value={{
        items,
        add: (item) => {
          const ex = items.find((i) => same(i, item.product_id, item.size));
          save(
            ex
              ? items.map((i) => (i === ex ? { ...i, qty: i.qty + item.qty } : i))
              : [...items, item],
          );
        },
        setQty: (id, size, qty) =>
          save(items.map((i) => (same(i, id, size) ? { ...i, qty: Math.max(1, qty) } : i))),
        remove: (id, size) => save(items.filter((i) => !same(i, id, size))),
        clear: () => save([]),
        count: items.reduce((a, i) => a + i.qty, 0),
        subtotal: items.reduce((a, i) => a + i.qty * i.price, 0),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("CartProvider missing");
  return c;
};
