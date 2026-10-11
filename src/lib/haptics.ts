/** Short vibration on supported phones (Android/APK webviews). Silently ignored elsewhere. */
export function buzz(ms = 12) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
}
