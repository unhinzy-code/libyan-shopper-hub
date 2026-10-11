import { useEffect, useRef, useState } from "react";
import s1 from "@/assets/hero-mobile.jpg";
import s2 from "@/assets/hero-slide-2.jpg";
import s3 from "@/assets/hero-slide-3.jpg";
import { cn } from "@/lib/utils";

const SLIDES = [s1, s2, s3];

export function HeroSlider() {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    setI(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
  };

  const go = (n: number) => {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollTo({ left: (rtl ? -1 : 1) * n * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const t = setTimeout(() => go((i + 1) % SLIDES.length), 4000);
    return () => clearTimeout(t);
  }, [i]);

  return (
    <div className="relative w-full bg-accent pt-28">
      <div ref={ref} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
        {SLIDES.map((src, n) => (
          <img key={n} src={src} alt="عروض کیوتی شوز" width={1280} height={768} loading={n ? "lazy" : "eager"} className="aspect-[5/3] w-full shrink-0 snap-center object-cover" />
        ))}
      </div>
      <div className="flex justify-center gap-1.5 bg-background py-3">
        {SLIDES.map((_, n) => (
          <button key={n} type="button" aria-label={`الشريحة ${n + 1}`} onClick={() => go(n)} className={cn("h-2 rounded-full transition-all duration-300", i === n ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30")} />
        ))}
      </div>
    </div>
  );
}
