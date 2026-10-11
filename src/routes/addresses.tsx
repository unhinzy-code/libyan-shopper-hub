import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { MapPin, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { StoreLayout, BrandButton } from "@/components/StoreLayout";
import { EmptyState, PhoneField } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { money, normalizePhone } from "@/lib/store";
import { buzz } from "@/lib/haptics";

export const Route = createFileRoute("/addresses")({
  head: () => ({
    meta: [
      { title: "عناوين التوصيل | کیوتی شوز" },
      { name: "description", content: "احفظي عناوين التوصيل وأرقام الهاتف للطلب السريع." },
      { property: "og:title", content: "عناوين التوصيل | کیوتی شوز" },
      { property: "og:description", content: "عناوين التوصيل المحفوظة للطلب السريع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Addresses,
});

const schema = z.object({
  label: z.string().trim().max(40),
  full_name: z.string().trim().min(2).max(80),
  details: z.string().trim().max(500),
});

function Addresses() {
  const { session, profile } = useAuth();
  const { tr } = useLang();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ label: "", full_name: "", phone: "", city_id: "", details: "" });
  const cities = useQuery({ queryKey: ["cities"], queryFn: async () => (await supabase.from("cities").select("*").eq("active", true).order("name")).data ?? [] });
  const list = useQuery({
    queryKey: ["addresses", session?.user.id],
    enabled: !!session,
    queryFn: async () => (await supabase.from("addresses").select("*").order("is_default", { ascending: false }).order("created_at")).data ?? [],
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["addresses"] });

  if (!session) return <StoreLayout><EmptyState emoji="lock" title={tr("سجّل دخول لحفظ عناوينك", "Log in to save addresses")} action={{ label: tr("دخول", "Log in"), to: "/auth" }} /></StoreLayout>;

  const save = async () => {
    const parsed = schema.safeParse(f);
    if (!parsed.success) return toast.error(tr("اكتبي الاسم الكامل", "Enter full name"));
    const phone = normalizePhone(f.phone || profile?.phone || "");
    if (!phone) return toast.error(tr("رقم الهاتف غير صحيح", "Invalid phone number"));
    if (!f.city_id) return toast.error(tr("اختر المدينة", "Choose a city"));
    const { error } = await supabase.from("addresses").insert({ ...parsed.data, phone, city_id: f.city_id, user_id: session.user.id, is_default: (list.data?.length ?? 0) === 0 });
    if (error) return toast.error(error.message);
    buzz();
    toast.success(tr("تم حفظ العنوان", "Address saved"));
    setOpen(false);
    setF({ label: "", full_name: "", phone: "", city_id: "", details: "" });
    refresh();
  };
  const makeDefault = async (id: string) => {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", session.user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    refresh();
  };
  const del = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    refresh();
  };
  const cityName = (id: string | null) => cities.data?.find((c) => c.id === id);

  return (
    <StoreLayout>
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-extrabold">{tr("عناوين التوصيل", "Delivery addresses")}</h1>
        <AnimatePresence>
          {list.data?.map((a, i) => {
            const c = cityName(a.city_id);
            return (
              <motion.div key={a.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }} exit={{ opacity: 0, x: -60 }} className="flex gap-3 rounded-3xl bg-card p-4 shadow-soft">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary"><MapPin className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-extrabold">{a.label || a.full_name} {a.is_default && <span className="rounded-full bg-primary px-2 text-[10px] text-primary-foreground">{tr("افتراضي", "Default")}</span>}</p>
                  <p>{a.full_name} · <span dir="ltr">{a.phone}</span></p>
                  <p className="text-muted-foreground">{c?.name}{c ? ` — ${money(c.delivery_fee)}` : ""}{a.details ? ` · ${a.details}` : ""}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {!a.is_default && <button aria-label="default" onClick={() => makeDefault(a.id)}><Star className="h-4 w-4 text-primary" /></button>}
                  <button aria-label="delete" onClick={() => del(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {list.data?.length === 0 && !open && <p className="text-center text-muted-foreground">{tr("لا توجد عناوين محفوظة بعد", "No saved addresses yet")}</p>}
        {open ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3 rounded-3xl bg-card p-4 shadow-soft">
            <input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder={tr("اسم العنوان (البيت، العمل...)", "Label (Home, Work...)")} className="w-full rounded-xl border-2 px-4 py-3" />
            <input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} placeholder={tr("الاسم الكامل", "Full name")} className="w-full rounded-xl border-2 px-4 py-3" />
            <PhoneField value={f.phone || profile?.phone || ""} onChange={(v) => setF({ ...f, phone: v })} />
            <select value={f.city_id} onChange={(e) => setF({ ...f, city_id: e.target.value })} className="w-full rounded-xl border-2 bg-card px-4 py-3">
              <option value="">{tr("اختر المدينة", "Choose city")}</option>
              {cities.data?.map((c) => <option key={c.id} value={c.id}>{c.name} — {money(c.delivery_fee)}</option>)}
            </select>
            <textarea value={f.details} maxLength={500} onChange={(e) => setF({ ...f, details: e.target.value })} placeholder={tr("الحي، الشارع، أقرب معلم", "Area, street, landmark")} className="min-h-20 w-full rounded-xl border-2 px-4 py-3" />
            <BrandButton onClick={save}>{tr("حفظ العنوان", "Save address")}</BrandButton>
          </motion.div>
        ) : (
          <button onClick={() => { buzz(); setOpen(true); }} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary py-4 font-bold text-primary transition active:scale-95">
            <Plus className="h-5 w-5" /> {tr("إضافة عنوان", "Add address")}
          </button>
        )}
      </div>
    </StoreLayout>
  );
}
