/**
 * AcademyHub - Login Rate Limiting & Account Lockout (Phase 15 Security Hardening)
 *
 * Implements brute-force protection:
 * - 5 failed attempts locks the target account/IP for 15 minutes.
 * - Prevents user enumeration by maintaining generic error responses.
 * - In-memory store for single-instance / development environments.
 *   Production upgrade note: Replace with Redis/Upstash for multi-region serverless clustering.
 */

interface RateLimitRecord {
  attempts: number;
  lockedUntil?: number;
  firstAttemptAt: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const attemptsStore = new Map<string, RateLimitRecord>();

export function checkLoginRateLimit(key: string, now: number = Date.now()): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterMs?: number;
} {
  const normalizedKey = key.toLowerCase().trim();
  const record = attemptsStore.get(normalizedKey);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  if (record.lockedUntil) {
    if (now < record.lockedUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterMs: record.lockedUntil - now,
      };
    }
    // Lockout expired - clear entry
    attemptsStore.delete(normalizedKey);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - record.attempts);
  return { allowed: true, remainingAttempts: remaining };
}

export function recordFailedLogin(key: string, now: number = Date.now()): {
  locked: boolean;
  remainingAttempts: number;
} {
  const normalizedKey = key.toLowerCase().trim();
  let record = attemptsStore.get(normalizedKey);

  if (!record) {
    record = { attempts: 1, firstAttemptAt: now };
    attemptsStore.set(normalizedKey, record);
    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - 1 };
  }

  // If already locked and not expired
  if (record.lockedUntil && now < record.lockedUntil) {
    return { locked: true, remainingAttempts: 0 };
  }

  // If previous lockout expired, reset
  if (record.lockedUntil && now >= record.lockedUntil) {
    record.attempts = 1;
    record.lockedUntil = undefined;
    record.firstAttemptAt = now;
    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - 1 };
  }

  record.attempts += 1;
  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    return { locked: true, remainingAttempts: 0 };
  }

  return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - record.attempts };
}

export function resetLoginRateLimit(key: string): void {
  const normalizedKey = key.toLowerCase().trim();
  attemptsStore.delete(normalizedKey);
}

export function _clearRateLimits(): void {
  attemptsStore.clear();
  contactAttemptsStore.clear();
}

// Contact form rate limiting: max 5 submissions per hour per IP (500 for localhost in test runs)
const contactAttemptsStore = new Map<string, { count: number; expiresAt: number }>();
const CONTACT_LIMIT = 5;
const CONTACT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkContactRateLimit(ip: string, now: number = Date.now()): {
  allowed: boolean;
  remaining: number;
} {
  const isLocal = ip === "127.0.0.1" || ip === "::1" || ip === "localhost";
  const limit = isLocal ? 500 : CONTACT_LIMIT;

  const record = contactAttemptsStore.get(ip);
  if (!record || now >= record.expiresAt) {
    contactAttemptsStore.set(ip, { count: 1, expiresAt: now + CONTACT_WINDOW_MS });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count };
}
