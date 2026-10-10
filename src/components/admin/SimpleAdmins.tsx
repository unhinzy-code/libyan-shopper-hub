import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function CategoriesAdmin() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const { data } = useQuery({ queryKey: ["categories"], queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [] });
  const refresh = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const add = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: name.trim(), sort_order: (data?.length ?? 0) + 1 });
    if (error) return toast.error(error.message);
    setName("");
    refresh();
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
    const a = data![i], b = data![i + dir];
    if (!b) return;
    await Promise.all([
      supabase.from("categories").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم القسم الجديد" className="flex-1 rounded-xl border-2 px-3 py-2" />
        <button onClick={add} className="rounded-xl bg-primary px-4 font-bold text-primary-foreground">+ إضافة</button>
      </div>
      {data?.map((c, i) => (
        <div key={c.id} className="flex items-center justify-between rounded-2xl border bg-card p-3">
          <span className="font-bold">{c.name}</span>
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
  const upd = async (id: string, p: { delivery_fee?: number; active?: boolean }) => {
    const { error } = await supabase.from("cities").update(p).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    refresh();
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="مدينة جديدة" className="flex-1 rounded-xl border-2 px-3 py-2" />
        <input value={fee} onChange={(e) => setFee(e.target.value)} type="number" placeholder="سعر التوصيل" className="w-32 rounded-xl border-2 px-3 py-2" />
        <button onClick={add} className="rounded-xl bg-primary px-4 font-bold text-primary-foreground">+</button>
      </div>
      {data?.map((c) => (
        <div key={c.id} className="flex items-center justify-between gap-2 rounded-2xl border bg-card p-3">
          <span className={`font-bold ${c.active ? "" : "text-muted-foreground line-through"}`}>{c.name}</span>
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
