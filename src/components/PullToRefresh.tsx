import { RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { buzz } from "@/lib/haptics";

const TRIGGER = 80;

/** Pull down while at the very top of the page to reload it. */
export function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [loading, setLoading] = useState(false);
  const start = useRef<number | null>(null);
  const armed = useRef(false);

  useEffect(() => {
    const down = (e: TouchEvent) => {
      start.current = window.scrollY <= 0 ? e.touches[0].clientY : null;
    };
    const move = (e: TouchEvent) => {
      if (start.current == null || window.scrollY > 0) return;
      const d = Math.max(0, (e.touches[0].clientY - start.current) * 0.5);
      setPull(Math.min(d, 120));
      if (d >= TRIGGER && !armed.current) { armed.current = true; buzz(); }
      if (d < TRIGGER) armed.current = false;
    };
    const up = () => {
      if (armed.current) { setLoading(true); setTimeout(() => window.location.reload(), 250); }
      else setPull(0);
      start.current = null;
      armed.current = false;
    };
    window.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("touchstart", down);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, []);

  if (pull <= 0 && !loading) return null;
  const p = Math.min(pull / TRIGGER, 1);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center" style={{ transform: `translateY(${loading ? 70 : pull * 0.8}px)`, transition: start.current == null ? "transform .2s" : undefined }}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft" style={{ opacity: loading ? 1 : p }}>
        <RefreshCw className={`h-5 w-5 text-primary ${loading ? "animate-spin" : ""}`} style={{ transform: loading ? undefined : `rotate(${p * 270}deg)` }} />
      </div>
    </div>
  );
}
