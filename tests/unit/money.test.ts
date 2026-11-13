import { describe, it, expect } from "vitest";
import {
  addPaisa,
  assertIntegerPaisa,
  calculatePercentagePaisa,
  formatPKR,
  multiplyPaisa,
  rupeesToPaisa,
  subtractPaisa,
} from "@/lib/money";

describe("Money Invariant & Math (src/lib/money.ts)", () => {
  it("converts whole rupees and decimal rupee strings to exact integer paisa", () => {
    expect(rupeesToPaisa(5000)).toBe(500000);
    expect(rupeesToPaisa("5000")).toBe(500000);
    expect(rupeesToPaisa("5000.50")).toBe(500050);
    expect(rupeesToPaisa("100.05")).toBe(10005);
  });

  it("formats integer paisa to clean PKR strings", () => {
    expect(formatPKR(500000)).toBe("PKR 5,000");
    expect(formatPKR(500050, true)).toBe("PKR 5,000.50");
  });

  it("safely adds and subtracts paisa amounts", () => {
    const fee = 300000; // PKR 3,000
    const lateFine = 20000; // PKR 200
    const discount = 50000; // PKR 500

    const subtotal = addPaisa(fee, lateFine);
    expect(subtotal).toBe(320000);

    const total = subtractPaisa(subtotal, discount);
    expect(total).toBe(270000);
  });

  it("calculates percentage discount via basis points without float precision issues", () => {
    const fee = 1000000; // PKR 10,000
    // 10% discount = 1000 basis points
    const discount = calculatePercentagePaisa(fee, 1000);
    expect(discount).toBe(100000); // PKR 1,000
  });

  it("throws error when float is passed to assertIntegerPaisa", () => {
    expect(() => assertIntegerPaisa(1234.56)).toThrow(TypeError);
  });
});
