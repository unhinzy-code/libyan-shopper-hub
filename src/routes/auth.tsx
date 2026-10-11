import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo, BrandButton } from "@/components/StoreLayout";
import { PhoneField } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth";
import { buzz } from "@/lib/haptics";
import { MIN_PASSWORD, normalizePhone, phoneToEmail } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string | undefined } => ({
    next: typeof s.next === "string" && s.next.startsWith("/") ? s.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "دخول / إنشاء حساب | کیوتی شوز" },
      { name: "description", content: "سجّل برقم هاتفك وكلمة المرور للطلب من کیوتی شوز." },
      { property: "og:title", content: "دخول / إنشاء حساب | کیوتی شوز" },
      { property: "og:description", content: "سجّل برقم هاتفك وكلمة المرور." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: (next ?? "/account") as "/account" });
  }, [session, next, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = normalizePhone(phone);
    if (!p) return toast.error("رقم الهاتف غير صحيح (مثال: 0912345678)");
    if (password.length < MIN_PASSWORD) return toast.error(`كلمة المرور ${MIN_PASSWORD} خانات على الأقل`);
    if (mode === "signup" && name.trim().length < 2) return toast.error("اكتب اسمك");
    setBusy(true);
    const email = phoneToEmail(p);
    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password, options: { data: { name: name.trim().slice(0, 80), phone: p } } })
        : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      buzz(60);
      const m = error.message.toLowerCase();
      toast.error(m.includes("already") ? "هذا الرقم مسجل مسبقاً، سجّل دخول" : m.includes("invalid") ? "رقم الهاتف أو كلمة المرور خطأ" : error.message);
      return;
    }
    toast.success(mode === "signup" ? "تم إنشاء الحساب " : "أهلاً بك!");
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-brand">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.span
          key={"s" + i}
          className="absolute rounded-full bg-card"
          style={{ width: (i % 3) + 2, height: (i % 3) + 2, top: `${(i * 37) % 100}%`, left: `${(i * 53) % 100}%` }}
          animate={{ opacity: [0.2, 1, 0.2], y: [0, -30, 0], scale: [0.6, 1.2, 0.6] }}
          transition={{ duration: 3 + (i % 5), repeat: Infinity, delay: (i % 7) * 0.4, ease: "easeInOut" }}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-card/15"
          style={{ width: 120 + i * 80, height: 120 + i * 80, top: `${10 + i * 12}%`, left: `${i * 30 - 10}%` }}
          animate={{ y: [0, -20, 0], x: [0, 15, 0] }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <div className="relative flex flex-1 flex-col items-center justify-center p-8 text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <Logo className="text-6xl text-primary-foreground" />
        </motion.div>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-3 text-lg font-bold text-primary-foreground">
          خطوتك الحلوة تبدأ من هنا 
        </motion.p>
      </div>
      <motion.form
        onSubmit={submit}
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="relative space-y-4 rounded-t-[2.5rem] bg-card p-6 pb-10 md:mx-auto md:mb-10 md:w-full md:max-w-md md:rounded-[2.5rem]"
      >
        <div className="relative grid grid-cols-2 rounded-2xl bg-muted p-1">
          {(["login", "signup"] as const).map((m) => (
            <button type="button" key={m} onClick={() => { buzz(); setMode(m); }} className={cn("relative rounded-xl py-2.5 font-bold", mode === m ? "text-primary" : "text-muted-foreground")}>
              {mode === m && <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-xl bg-card shadow-soft" />}
              <span className="relative">{m === "login" ? "دخول" : "حساب جديد"}</span>
            </button>
          ))}
        </div>
        <AnimatePresence initial={false}>
          {mode === "signup" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex items-center gap-2 rounded-2xl border-2 px-4 transition focus-within:border-primary">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" className="w-full bg-transparent py-3.5 outline-none" />
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <PhoneField value={phone} onChange={setPhone} />
        <div className="flex items-center gap-2 rounded-2xl border-2 px-4 transition focus-within:border-primary">
          <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={`كلمة المرور (${MIN_PASSWORD} خانات على الأقل)`} className="w-full bg-transparent py-3.5 outline-none" />
          <button type="button" aria-label="إظهار" onClick={() => setShow(!show)} className="text-muted-foreground">
            {show ? <EyeOff className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </button>
          {show && <Eye className="hidden" />}
        </div>
        <BrandButton disabled={busy}>
          {busy ? <motion.span className="inline-block h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} /> : mode === "login" ? "دخول" : "إنشاء حساب"}
        </BrandButton>
        <button type="button" onClick={() => navigate({ to: "/" })} className="w-full text-center font-bold text-primary">
          الدخول كضيف
        </button>
      </motion.form>
    </div>
  );
}
