/**
 * EduFlow - Money Math Module
 * INVARIANT: Money is ALWAYS integer minor units (paisa: 1 PKR = 100 paisas).
 * No floats anywhere in financial storage or arithmetic.
 * All financial math must live in this file.
 */

export type Paisa = number; // Integer representing minor unit (paisa)

/**
 * Validates that an amount is a valid integer minor unit.
 * Throws an error if the amount is a float, NaN, or non-finite.
 */
export function assertIntegerPaisa(amount: number): asserts amount is Paisa {
  if (!Number.isSafeInteger(amount)) {
    throw new TypeError(`[Money Error] Amount must be a safe integer in minor units (paisa). Received: ${amount}`);
  }
}

/**
 * Converts Pakistani Rupees (PKR) major unit string or integer to minor unit (paisa).
 * Safely handles rupee strings like "5000" or "5000.50".
 */
export function rupeesToPaisa(rupees: number | string): Paisa {
  if (typeof rupees === "number") {
    if (!Number.isFinite(rupees)) {
      throw new TypeError(`[Money Error] Invalid rupee amount: ${rupees}`);
    }
    // Round to avoid float precision issues when converting major to minor
    return Math.round(rupees * 100);
  }

  const cleaned = rupees.trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) {
    throw new Error(`[Money Error] Invalid rupee format: "${rupees}"`);
  }

  const [whole, decimal = ""] = cleaned.split(".");
  const paddedDecimal = decimal.padEnd(2, "0").slice(0, 2);
  const sign = cleaned.startsWith("-") ? -1 : 1;
  const absWhole = Math.abs(parseInt(whole, 10));
  const absDecimal = parseInt(paddedDecimal, 10);

  return sign * (absWhole * 100 + absDecimal);
}

/**
 * Converts minor unit (paisa) to a formatted PKR currency string.
 * Example: 500000 -> "PKR 5,000"
 */
export function formatPKR(paisa: Paisa, includeDecimals = false): string {
  assertIntegerPaisa(paisa);

  const isNegative = paisa < 0;
  const absolutePaisa = Math.abs(paisa);
  const wholeRupees = Math.floor(absolutePaisa / 100);
  const remainingPaisa = absolutePaisa % 100;

  const formattedRupees = wholeRupees.toLocaleString("en-PK");

  let result = includeDecimals || remainingPaisa > 0
    ? `PKR ${formattedRupees}.${remainingPaisa.toString().padStart(2, "0")}`
    : `PKR ${formattedRupees}`;

  return isNegative ? `-${result}` : result;
}

/**
 * Safe addition of two paisa amounts.
 */
export function addPaisa(a: Paisa, b: Paisa): Paisa {
  assertIntegerPaisa(a);
  assertIntegerPaisa(b);
  const sum = a + b;
  assertIntegerPaisa(sum);
  return sum;
}

/**
 * Safe subtraction: a - b
 */
export function subtractPaisa(a: Paisa, b: Paisa): Paisa {
  assertIntegerPaisa(a);
  assertIntegerPaisa(b);
  const diff = a - b;
  assertIntegerPaisa(diff);
  return diff;
}

/**
 * Multiply paisa by an integer multiplier or factor.
 * Rounds to nearest integer paisa using Math.round.
 */
export function multiplyPaisa(amount: Paisa, factor: number): Paisa {
  assertIntegerPaisa(amount);
  const product = Math.round(amount * factor);
  assertIntegerPaisa(product);
  return product;
}

/**
 * Calculates a percentage discount or fee safely in paisa.
 * basisPoints: 100 basis points = 1.00% (e.g. 500 bps = 5%).
 */
export function calculatePercentagePaisa(amount: Paisa, basisPoints: number): Paisa {
  assertIntegerPaisa(amount);
  if (!Number.isSafeInteger(basisPoints)) {
    throw new TypeError(`[Money Error] Basis points must be an integer. Received: ${basisPoints}`);
  }
  const result = Math.round((amount * basisPoints) / 10000);
  assertIntegerPaisa(result);
  return result;
}
