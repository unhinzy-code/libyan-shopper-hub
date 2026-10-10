import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Uploads a file and returns a long-lived signed URL. */
export async function uploadImage(bucket: "products" | "receipts", folder: string, file: File) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from(bucket).createSignedUrl(path, TEN_YEARS);
  if (e2) throw e2;
  return data.signedUrl;
}
