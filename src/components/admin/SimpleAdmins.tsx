import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/upload";

export function CategoriesAdmin() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const { data } = useQuery({ queryKey: ["categories"], queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [] });
  const refresh = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const add = async () => {
    if (!name.trim()) return toast.error("اكتب اسم القسم بالعربي");
    setBusy(true);
    try {
      const image_url = file ? await uploadImage("products", "categories", file) : null;
      const { error } = await supabase.from("categories").insert({ name: name.trim(), name_en: nameEn.trim(), image_url, sort_order: (data?.length ?? 0) + 1 });
      if (error) throw error;
      toast.success("تمت إضافة القسم");
      setName(""); setNameEn(""); setFile(null);
      refresh();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  const rename = async (id: string, old: string) => {
    const n = prompt("الاسم الجديد", old);
    if (!n?.trim()) return;
    await supabase.from("categories").update({ name: n.trim() }).eq("id", id);
    refresh();
  };
  const del = async (id: string) => {
    if (!confirm("حذف القسم؟ المنتجات ستبقى بدون قسم")) return;
    await supabase.from("categories").delete().eq("id", id);
    refresh();
  };
  const move = async (i: number, dir: -1 | 1) => {
    const a = data![i]!, b = data![i + dir];
    if (!b) return;
    await Promise.all([
      supabase.from("categories").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    refresh();
  };

  return (
    <div className="space-y-3">
      <div className="space-y-3 rounded-2xl border bg-card p-4">
        <p className="font-extrabold">قسم جديد</p>
        <label className="flex cursor-pointer items-center gap-3">
          <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-primary bg-accent">
            {file ? <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" /> : <Camera className="h-7 w-7 text-primary" />}
          </span>
          <span className="text-sm font-bold text-muted-foreground">{file ? "تغيير الصورة" : "اختر صورة القسم"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم بالعربي" className="w-full rounded-xl border-2 px-3 py-2" />
        <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" placeholder="English name" className="w-full rounded-xl border-2 px-3 py-2" />
        <button onClick={add} disabled={busy} className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground transition active:scale-95 disabled:opacity-60">{busy ? "جاري الحفظ..." : "إضافة القسم"}</button>
      </div>
      {data?.map((c, i) => (
        <div key={c.id} className="flex items-center justify-between rounded-2xl border bg-card p-3">
          <label className="flex cursor-pointer items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-accent">
              {c.image_url ? <img src={c.image_url} alt="" className="h-full w-full object-cover" /> : <Camera className="h-6 w-6 text-muted-foreground" />}
            </span>
            <span className="font-bold">{c.name}</span>
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return;
              try { const url = await uploadImage("products", "categories", f); await supabase.from("categories").update({ image_url: url }).eq("id", c.id); toast.success("تم رفع الصورة"); refresh(); } catch (err) { toast.error((err as Error).message); }
            }} />
          </label>
          <div className="flex gap-1 text-sm">
            <button onClick={() => move(i, -1)} className="rounded-lg border px-2">▲</button>
            <button onClick={() => move(i, 1)} className="rounded-lg border px-2">▼</button>
            <button onClick={() => rename(c.id, c.name)} className="rounded-lg border border-primary px-2 text-primary">تعديل</button>
            <button onClick={() => del(c.id)} className="rounded-lg border border-destructive px-2 text-destructive">حذف</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CitiesAdmin() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [fee, setFee] = useState("");
  const { data } = useQuery({ queryKey: ["admin-cities"], queryFn: async () => (await supabase.from("cities").select("*").order("name")).data ?? [] });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-cities"] });
    qc.invalidateQueries({ queryKey: ["cities"] });
  };
  const add = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("cities").insert({ name: name.trim(), delivery_fee: Number(fee || 0) });
    if (error) return toast.error(error.message);
    setName(""); setFee(""); refresh();
  };
  const upd = async (id: string, p: { delivery_fee?: number; active?: boolean; delivery_days?: string }) => {
    const { error } = await supabase.from("cities").update(p).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    refresh();
  };
  const [cq, setCq] = useState("");
  return (
    <div className="space-y-3">
      <input value={cq} onChange={(e) => setCq(e.target.value)} placeholder="بحث عن مدينة" className="w-full rounded-xl border-2 px-3 py-2" />
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="مدينة جديدة" className="flex-1 rounded-xl border-2 px-3 py-2" />
        <input value={fee} onChange={(e) => setFee(e.target.value)} type="number" placeholder="سعر التوصيل" className="w-32 rounded-xl border-2 px-3 py-2" />
        <button onClick={add} className="rounded-xl bg-primary px-4 font-bold text-primary-foreground">+</button>
      </div>
      {data?.filter((c) => !cq || c.name.includes(cq)).map((c) => (
        <div key={c.id} className="flex items-center justify-between gap-2 rounded-2xl border bg-card p-3">
          <div className="min-w-0 flex-1">
            <span className={`font-bold ${c.active ? "" : "text-muted-foreground line-through"}`}>{c.name}</span>
            <input defaultValue={c.delivery_days} placeholder="أيام التوصيل" onBlur={(e) => e.target.value !== c.delivery_days && upd(c.id, { delivery_days: e.target.value })} className="mt-1 block w-full rounded-lg border px-2 py-1 text-xs" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <input type="number" defaultValue={c.delivery_fee} onBlur={(e) => Number(e.target.value) !== Number(c.delivery_fee) && upd(c.id, { delivery_fee: Number(e.target.value) })} className="w-20 rounded-lg border-2 px-2 py-1" />
            <span>د.ل</span>
            <button onClick={() => upd(c.id, { active: !c.active })} className="rounded-lg border px-2 py-1">{c.active ? "إيقاف" : "تفعيل"}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationsAdmin() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const { data } = useQuery({ queryKey: ["admin-notifs"], queryFn: async () => (await supabase.from("notifications").select("*").is("user_id", null).order("created_at", { ascending: false })).data ?? [] });
  const send = async () => {
    if (!title.trim()) return toast.error("اكتب العنوان");
    const { error } = await supabase.from("notifications").insert({ title: title.trim(), body: body.trim() });
    if (error) return toast.error(error.message);
    toast.success("تم إرسال الإشعار لكل الزبائن");
    setTitle(""); setBody("");
    qc.invalidateQueries({ queryKey: ["admin-notifs"] });
  };
  const del = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-notifs"] });
  };
  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-2xl border bg-card p-4">
        <h3 className="font-bold">إشعار جديد لكل الزبائن</h3>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="العنوان (مثال: تخفيضات 30%)" className="w-full rounded-xl border-2 px-3 py-2" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="التفاصيل" className="w-full rounded-xl border-2 px-3 py-2" />
        <button onClick={send} className="w-full rounded-xl bg-primary py-2.5 font-bold text-primary-foreground">إرسال</button>
      </div>
      {data?.map((n) => (
        <div key={n.id} className="flex items-center justify-between rounded-2xl border bg-card p-3">
          <div><p className="font-bold">{n.title}</p><p className="text-sm text-muted-foreground">{n.body}</p></div>
          <button onClick={() => del(n.id)} className="rounded-lg border border-destructive px-2 text-sm text-destructive">حذف</button>
        </div>
      ))}
    </div>
  );
}
