import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Bell, ChevronLeft, Globe, Heart, LogOut, MapPin, Shield, Star, Truck, Wallet, LogIn } from "lucide-react";
import { FaWhatsapp, FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StoreLayout } from "@/components/StoreLayout";
import { useAuth } from "@/lib/auth";
import { buzz } from "@/lib/haptics";
import { money, SOCIAL } from "@/lib/store";
import sahara from "@/assets/sahara.png.asset.json";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "حسابي | کیوتی شوز" },
      { name: "description", content: "حسابك، الإعدادات والدعم في کیوتی شوز." },
      { property: "og:title", content: "حسابي | کیوتی شوز" },
      { property: "og:description", content: "حسابك والإعدادات والدعم." },
    ],
  }),
  component: Account,
});

function Account() {
  const { profile, session, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [lang, setLang] = useState("ar");
  const wallet = useQuery({
    queryKey: ["wallet", session?.user.id],
    enabled: !!session,
    queryFn: async () => (await supabase.from("profiles").select("wallet_balance").eq("id", session!.user.id).maybeSingle()).data?.wallet_balance ?? 0,
  });

  const logout = async () => {
    buzz(30);
    await qc.cancelQueries();
    qc.clear();
    await signOut();
    toast.success("تم تسجيل الخروج");
    navigate({ to: "/account", replace: true });
  };

  return (
    <StoreLayout>
      <div className="mx-auto max-w-md space-y-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-brand p-6 text-primary-foreground shadow-brand">
          <motion.span className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-card/15" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 5, repeat: Infinity }} />
          {session ? (
            <div className="relative">
              <p className="text-sm opacity-90">أهلاً بك </p>
              <h1 className="text-2xl font-extrabold">{profile?.name || "عميلتنا"}</h1>
              <p dir="ltr" className="text-right opacity-90">{profile?.phone}</p>
            </div>
          ) : (
            <div className="relative space-y-3">
              <h1 className="text-2xl font-extrabold">مرحباً بك في کیوتی شوز </h1>
              <p className="opacity-90">سجّل دخول لتتبع طلباتك وحفظ المفضلة</p>
              <Link to="/auth" search={{}} onClick={() => buzz()} className="inline-flex items-center gap-2 rounded-full bg-card px-5 py-2 font-bold text-primary">
                <LogIn className="h-4 w-4" /> دخول / حساب جديد
              </Link>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-3 gap-3">
          <Quick to="/orders" icon={<Truck />} label="تتبع" />
          <Quick to="/favorites" icon={<Heart />} label="المفضلة" />
          <Quick to="/wallet" icon={<Wallet />} label={session ? money(wallet.data) : "المحفظة"} />
        </div>

        <Group title="الإعدادات">
          <Row to="/notifications" icon={<Bell />} label="الإشعارات" />
          <Row to="/checkout" icon={<MapPin />} label="عنوان التوصيل" hint="تختاره عند الطلب" />
          <button onClick={() => { buzz(); setLang(lang === "ar" ? "en" : "ar"); toast("English coming soon — العربية مفعلة"); }} className="flex w-full items-center gap-3 px-4 py-3.5 text-right">
            <Ico><Globe /></Ico>
            <span className="flex-1 font-bold">اللغة</span>
            <span className="text-sm text-muted-foreground">العربية</span>
          </button>
          {isAdmin && <Row to="/admin" icon={<Shield />} label="لوحة الإدارة" />}
        </Group>

        <Group title="الدعم والتواصل">
          <div className="grid grid-cols-4 gap-2 p-4">
            <Social href={SOCIAL.whatsapp} label="واتساب" icon={<FaWhatsapp className="h-6 w-6" style={{ color: "#25D366" }} />} />
            <Social href={SOCIAL.instagram} label="انستغرام" icon={<FaInstagram className="h-6 w-6" style={{ color: "#E4405F" }} />} />
            <Social href={SOCIAL.facebook} label="فيسبوك" icon={<FaFacebook className="h-6 w-6" style={{ color: "#1877F2" }} />} />
            <Social href={SOCIAL.tiktok} label="تيك توك" icon={<FaTiktok className="h-6 w-6" />} />
          </div>
          <RateApp />
        </Group>

        {session && (
          <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-destructive/40 py-3.5 font-bold text-destructive">
            <LogOut className="h-5 w-5" /> تسجيل خروج
          </button>
        )}

        <a href="https://sts.com.ly" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 py-4 text-xs text-muted-foreground">
          <span>صُنع بواسطة</span>
          <img src={sahara.url} alt="Sahara" className="h-10 w-auto" />
        </a>
      </div>
    </StoreLayout>
  );
}

function Quick({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <motion.div whileTap={{ scale: 0.92 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link to={to} onClick={() => buzz()} className="flex flex-col items-center gap-2 rounded-3xl bg-card p-4 shadow-soft">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-primary [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        <span className="text-xs font-bold">{label}</span>
      </Link>
    </motion.div>
  );
}

const Ico = ({ children }: { children: ReactNode }) => (
  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-primary [&>svg]:h-5 [&>svg]:w-5">{children}</span>
);

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-3xl bg-card shadow-soft">
      <h2 className="px-4 pt-4 text-sm font-bold text-muted-foreground">{title}</h2>
      <div className="divide-y">{children}</div>
    </motion.section>
  );
}

function Row({ to, icon, label, hint }: { to: string; icon: ReactNode; label: string; hint?: string }) {
  return (
    <Link to={to} onClick={() => buzz()} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-muted">
      <Ico>{icon}</Ico>
      <span className="flex-1 font-bold">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function Social({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <motion.a whileTap={{ scale: 0.9 }} href={href} target="_blank" rel="noreferrer" onClick={() => buzz()} className="flex flex-col items-center gap-1 rounded-2xl bg-muted py-3">
      {icon}
      <span className="text-[11px] font-bold">{label}</span>
    </motion.a>
  );
}

function RateApp() {
  const [stars, setStars] = useState(0);
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Ico><Star /></Ico>
      <span className="flex-1 font-bold">قيّم التطبيق</span>
      <div dir="ltr" className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button
            key={n}
            whileTap={{ scale: 1.4 }}
            aria-label={`${n} نجوم`}
            onClick={() => {
              buzz();
              setStars(n);
              toast.success("شكراً لتقييمك ");
            }}
          >
            <Star className={n <= stars ? "h-5 w-5 fill-star text-star" : "h-5 w-5 text-muted-foreground"} />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
