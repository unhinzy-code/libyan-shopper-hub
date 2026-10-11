export const STORE_NAME = "کیوتی شوز";
export const ADMIN_PHONE = "0924554163";

export const BANKS = [
  { name: "المصرف الإسلامي", iban: "LY51025010111920943410016" },
  { name: "مصرف التضامن", iban: "LY69015303303220066266011" },
  { name: "مصرف الأندلس", iban: "LY55027202202908109901010" },
  { name: "مصرف شمال أفريقيا", iban: "LY67007036036011314471014" },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: "قيد المراجعة",
  confirmed: "تم التأكيد",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};
export const STATUSES = Object.keys(STATUS_LABELS);

export const PAYMENT_LABELS: Record<string, string> = {
  cash: "نقداً عند الاستلام",
  transfer: "تحويل مصرفي",
};

/** Normalizes Libyan phone numbers to 09XXXXXXXX. Returns null if invalid. */
export function normalizePhone(input: string): string | null {
  let p = input.replace(/[\s-]/g, "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  if (p.startsWith("+218")) p = "0" + p.slice(4);
  else if (p.startsWith("00218")) p = "0" + p.slice(5);
  else if (p.startsWith("218")) p = "0" + p.slice(3);
  else if (p.startsWith("9")) p = "0" + p;
  return /^09\d{8}$/.test(p) ? p : null;
}

export const phoneToEmail = (phone: string) => `${phone}@cuteshoes.ly`;

export const MIN_PASSWORD = 8;

export const money = (n: number | string | null | undefined) =>
  `${Number(n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} د.ل`;

/** Support links — replace with the store's real accounts. */
export const SOCIAL = {
  whatsapp: "https://wa.me/218919720022",
  instagram: "https://instagram.com/cutie_shoes22",
  facebook: "https://facebook.com/search/top?q=cutie_shoes22",
  tiktok: "https://tiktok.com/",
};
