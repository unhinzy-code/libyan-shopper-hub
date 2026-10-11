import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function HeroCarousel({ slides }: { slides: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);

  const go = (n: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: -n * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const t = setInterval(() => go((i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [i, slides.length]);

  return (
    <div className="relative">
      <div
        ref={ref}
        dir="rtl"
        onScroll={(e) => {
          const el = e.currentTarget;
          setI(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
        }}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {slides.map((s, k) => (
          <img key={k} src={s} alt="کیوتی شوز" className="block h-[42vh] max-h-[380px] w-full shrink-0 snap-center object-cover md:h-[60vh] md:max-h-none" />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
        {slides.map((_, k) => (
          <button
            key={k}
            aria-label={`صورة ${k + 1}`}
            onClick={() => go(k)}
            className={cn("h-2 rounded-full transition-all duration-300", k === i ? "w-6 bg-primary" : "w-2 bg-primary/30")}
          />
        ))}
      </div>
    </div>
  );
}
