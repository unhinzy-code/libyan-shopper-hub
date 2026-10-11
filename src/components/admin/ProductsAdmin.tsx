import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/store";
import { uploadImage } from "@/lib/upload";
import type { Product } from "@/components/ProductCard";

type Form = {
  id?: string;
  name: string;
  description: string;
  price: string;
  old_price: string;
  stock: string;
  sizes: string;
  image_url: string | null;
  category_id: string;
  featured: boolean;
  active: boolean;
};
const empty: Form = { name: "", description: "", price: "", old_price: "", stock: "10", sizes: "", image_url: null, category_id: "", featured: false, active: true };

export function ProductsAdmin() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const cats = useQuery({ queryKey: ["categories"], queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [] });
  const { data } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => ((await supabase.from("products").select("*").order("created_at", { ascending: false })).data ?? []) as Product[],
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const save = async () => {
    if (!form) return;
    if (!form.name.trim() || !form.price) return toast.error("الاسم والسعر مطلوبين");
    setBusy(true);
    const row = {
      name: form.name.trim(),
      description: form.description,
      price: Number(form.price),
      old_price: form.old_price ? Number(form.old_price) : null,
      stock: Number(form.stock || 0),
      sizes: form.sizes.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
      image_url: form.image_url,
      category_id: form.category_id || null,
      featured: form.featured,
      active: form.active,
    };
    const { error } = form.id ? await supabase.from("products").update(row).eq("id", form.id) : await supabase.from("products").insert(row);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    setForm(null);
    refresh();
  };

  const patch = async (id: string, p: Partial<Product>) => {
    const { error } = await supabase.from("products").update(p).eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };
  const del = async (id: string) => {
    if (!confirm("حذف المنتج؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  if (form)
    return (
      <div className="space-y-3 rounded-2xl border bg-card p-4">
        <h2 className="text-lg font-extrabold">{form.id ? "تعديل منتج" : "منتج جديد"}</h2>
        <label className="block cursor-pointer">
          <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-muted">
            {form.image_url ? <img src={form.image_url} alt="" className="h-full w-full object-cover" /> : busy ? "..." : "صورة"}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            try { const url = await uploadImage("products", "items", f); setForm((x) => x && { ...x, image_url: url }); } catch (err) { toast.error((err as Error).message); }
            setBusy(false);
          }} />
        </label>
        <In label="اسم المنتج" v={form.name} on={(v) => setForm({ ...form, name: v })} />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="الوصف" className="min-h-20 w-full rounded-xl border-2 px-3 py-2" />
        <div className="grid grid-cols-3 gap-2">
          <In label="السعر (د.ل)" type="number" v={form.price} on={(v) => setForm({ ...form, price: v })} />
          <In label="السعر قبل الخصم" type="number" v={form.old_price} on={(v) => setForm({ ...form, old_price: v })} />
          <In label="الكمية" type="number" v={form.stock} on={(v) => setForm({ ...form, stock: v })} />
        </div>
        <In label="المقاسات (افصل بفاصلة) مثال: 36, 37, 38" v={form.sizes} on={(v) => setForm({ ...form, sizes: v })} />
        <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-xl border-2 bg-card px-3 py-2">
          <option value="">بدون قسم</option>
          {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> مميز </label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> ظاهر في المتجر</label>
        </div>
        <div className="flex gap-2">
          <button disabled={busy} onClick={save} className="flex-1 rounded-xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-50">حفظ</button>
          <button onClick={() => setForm(null)} className="rounded-xl border-2 px-6 font-bold">إلغاء</button>
        </div>
      </div>
    );

  const list = (data ?? []).filter((p) => !q || p.name.includes(q));
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث" className="flex-1 rounded-xl border-2 px-3 py-2" />
        <button onClick={() => setForm(empty)} className="rounded-xl bg-primary px-4 font-bold text-primary-foreground">+ منتج</button>
      </div>
      {list.map((p) => (
        <div key={p.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">{p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}</div>
          <div className="flex-1">
            <p className="font-bold">{p.name} {p.featured && ""} {!p.active && <span className="text-xs text-muted-foreground">(مخفي)</span>}</p>
            <p className="text-sm">{money(p.price)} · مخزون: <b className={p.stock < 5 ? "text-destructive" : ""}>{p.stock}</b></p>
          </div>
          <div className="flex flex-wrap gap-1 text-xs">
            <button onClick={() => patch(p.id, { active: !p.active })} className="rounded-lg border px-2 py-1">{p.active ? "إخفاء" : "إظهار"}</button>
            <button onClick={() => patch(p.id, { featured: !p.featured })} className="rounded-lg border px-2 py-1"><Star className="h-4 w-4" /></button>
            <button onClick={() => setForm({ id: p.id, name: p.name, description: p.description, price: String(p.price), old_price: p.old_price ? String(p.old_price) : "", stock: String(p.stock), sizes: p.sizes.join(", "), image_url: p.image_url, category_id: p.category_id ?? "", featured: p.featured, active: p.active })} className="rounded-lg border border-primary px-2 py-1 text-primary">تعديل</button>
            <button onClick={() => del(p.id)} className="rounded-lg border border-destructive px-2 py-1 text-destructive">حذف</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function In({ label, v, on, type = "text" }: { label: string; v: string; on: (v: string) => void; type?: string }) {
  return (
    <label className="block text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input type={type} value={v} onChange={(e) => on(e.target.value)} className="mt-1 w-full rounded-xl border-2 px-3 py-2" />
    </label>
  );
}
