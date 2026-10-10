import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo, BrandButton } from "@/components/StoreLayout";
import { useAuth } from "@/lib/auth";
import { MIN_PASSWORD, normalizePhone, phoneToEmail } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string } => ({
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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: (next ?? "/") as "/" });
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
      const m = error.message.toLowerCase();
      toast.error(
        m.includes("already") ? "هذا الرقم مسجل مسبقاً، سجّل دخول" : m.includes("invalid") ? "رقم الهاتف أو كلمة المرور خطأ" : error.message,
      );
      return;
    }
    toast.success(mode === "signup" ? "تم إنشاء الحساب 🎉" : "أهلاً بك!");
  };

  return (
    <div className="flex min-h-screen flex-col bg-primary">
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <Logo className="text-6xl text-secondary" />
        <p className="mt-4 text-xl font-bold text-primary-foreground">ليش تطلب من کیوتی شوز؟ 💜</p>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-t-[2rem] bg-card p-6 md:mx-auto md:mb-10 md:w-full md:max-w-md md:rounded-[2rem]">
        <div className="grid grid-cols-2 rounded-xl bg-muted p-1">
          {(["login", "signup"] as const).map((m) => (
            <button type="button" key={m} onClick={() => setMode(m)} className={cn("rounded-lg py-2 font-bold", mode === m ? "bg-card text-primary shadow" : "text-muted-foreground")}>
              {m === "login" ? "دخول" : "حساب جديد"}
            </button>
          ))}
        </div>
        {mode === "signup" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" className="w-full rounded-xl border-2 px-4 py-3 outline-none focus:border-primary" />
        )}
        <div className="flex items-center rounded-xl border-2 px-4 focus-within:border-primary">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="رقم الهاتف 09XXXXXXXX" className="w-full py-3 outline-none" />
          <span dir="ltr" className="text-muted-foreground">🇱🇾 +218</span>
        </div>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={`كلمة المرور (${MIN_PASSWORD} خانات على الأقل)`} className="w-full rounded-xl border-2 px-4 py-3 outline-none focus:border-primary" />
        <BrandButton disabled={busy}>{busy ? "..." : mode === "login" ? "دخول" : "إنشاء حساب"}</BrandButton>
        <button type="button" onClick={() => navigate({ to: "/" })} className="w-full text-center font-bold text-primary underline">
          الدخول كضيف
        </button>
      </form>
    </div>
  );
}
