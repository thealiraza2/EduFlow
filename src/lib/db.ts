import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string {
  let url = process.env.DATABASE_URL || "";
  if (!url) return url;

  // Enforce PgBouncer Transaction Pooler settings for serverless
  if (url.includes("pooler.supabase.com") || url.includes(":6543")) {
    const hasPgbouncer = url.includes("pgbouncer=true");
    const hasConnLimit = url.includes("connection_limit=");

    if (!hasPgbouncer) {
      url += (url.includes("?") ? "&" : "?") + "pgbouncer=true";
    }
    if (!hasConnLimit) {
      url += (url.includes("?") ? "&" : "?") + "connection_limit=1";
    }
  }
  return url;
}

const dbUrl = getDatabaseUrl();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// Always retain singleton instance in all environments to prevent connection pool exhaustion and reconnection latency
globalForPrisma.prisma = db;

