import { describe, it, expect } from "vitest";
import { normalizePhone, BANKS, ADMIN_PHONE, MIN_PASSWORD } from "./store";

describe("store rules", () => {
  it("normalizes libyan phones", () => {
    expect(normalizePhone("+218924554163")).toBe("0924554163");
    expect(normalizePhone("924554163")).toBe("0924554163");
    expect(normalizePhone("12345")).toBeNull();
  });
  it("admin phone", () => expect(ADMIN_PHONE).toBe("0924554163"));
  it("password min 8", () => expect(MIN_PASSWORD).toBe(8));
  it("four banks", () => {
    expect(BANKS.map((b) => b.iban)).toEqual([
      "LY51025010111920943410016",
      "LY69015303303220066266011",
      "LY55027202202908109901010",
      "LY67007036036011314471014",
    ]);
  });
});
