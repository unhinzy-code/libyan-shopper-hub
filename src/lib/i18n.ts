import { useEffect, useState } from "react";

export type Lang = "ar" | "en";
const KEY = "cutie-lang";

const dict = {
  home: ["الرئيسية", "Home"],
  categories: ["الأقسام", "Categories"],
  cart: ["السلة", "Cart"],
  account: ["حسابي", "Account"],
  search: ["ابحث عن حذاء...", "Search shoes..."],
  welcome: ["أهلاً بك", "Welcome back"],
  customer: ["عميلتنا", "Customer"],
  guestTitle: ["حسابك في کیوتی شوز", "Your Cutie Shoes account"],
  guestSub: ["سجّلي دخولك لتتبع طلباتك وحفظ المفضلة واستخدام المحفظة", "Sign in to track orders, save favorites and use your wallet"],
  login: ["تسجيل الدخول", "Sign in"],
  register: ["إنشاء حساب جديد", "Create account"],
  noAccount: ["ليس لديك حساب؟", "New here?"],
  track: ["تتبع", "Track"],
  favorites: ["المفضلة", "Favorites"],
  wallet: ["المحفظة", "Wallet"],
  settings: ["الإعدادات", "Settings"],
  myOrders: ["طلباتي", "My orders"],
  notifications: ["الإشعارات", "Notifications"],
  address: ["عنوان التوصيل", "Delivery address"],
  addressHint: ["تختاره عند الطلب", "Chosen at checkout"],
  language: ["اللغة", "Language"],
  langName: ["العربية", "English"],
  admin: ["لوحة الإدارة", "Admin panel"],
  support: ["الدعم والتواصل", "Support"],
  whatsapp: ["واتساب", "WhatsApp"],
  instagram: ["انستغرام", "Instagram"],
  facebook: ["فيسبوك", "Facebook"],
  tiktok: ["تيك توك", "TikTok"],
  rate: ["قيّم التطبيق", "Rate the app"],
  thanks: ["شكراً لتقييمك", "Thanks for rating"],
  logout: ["تسجيل خروج", "Log out"],
  loggedOut: ["تم تسجيل الخروج", "Logged out"],
  madeBy: ["صُنع بواسطة Sahara", "Made by Sahara"],
} as const;

export type TKey = keyof typeof dict;

let current: Lang = "ar";
const listeners = new Set<(l: Lang) => void>();

function apply(l: Lang) {
  current = l;
  document.documentElement.lang = l;
  document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  listeners.forEach((f) => f(l));
}

export function setLang(l: Lang) {
  localStorage.setItem(KEY, l);
  apply(l);
}

export function useLang() {
  const [lang, set] = useState<Lang>("ar");
  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Lang) || current;
    if (saved !== current) apply(saved);
    set(saved);
    listeners.add(set);
    return () => { listeners.delete(set); };
  }, []);
  const t = (k: TKey) => dict[k][lang === "ar" ? 0 : 1];
  const tr = (ar: string, en: string) => (lang === "ar" ? ar : en);
  return { lang, t, tr, setLang };
}
