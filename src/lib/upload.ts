import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const IMGBB_KEYS = ["7f26c8f33aaaf84549566d8b1071a1da", "94793e93b68d8fc3724c698f870cdb73"];

async function toImgbb(file: File) {
  for (const key of IMGBB_KEYS) {
    try {
      const fd = new FormData();
      fd.append("image", file);
      const r = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, { method: "POST", body: fd });
      const j = await r.json();
      if (j?.success && j.data?.url) return j.data.url as string;
    } catch { /* try next key */ }
  }
  return null;
}

/** Product/category images go to ImgBB; receipts stay private in storage. */
export async function uploadImage(bucket: "products" | "receipts", folder: string, file: File) {
  if (bucket === "products") {
    const url = await toImgbb(file);
    if (url) return url;
  }
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from(bucket).createSignedUrl(path, TEN_YEARS);
  if (e2) throw e2;
  return data.signedUrl;
}
