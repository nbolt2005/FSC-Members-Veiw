import { PrismaClient } from '@prisma/client'

/**
 * Prisma client singleton.
 *
 * Next.js hot-reloads modules in development, which would normally create a
 * new PrismaClient (and open a new connection pool) on every code change.
 * Attaching the instance to `globalThis` ensures we reuse the same client
 * across reloads while still getting a fresh client in production.
 *
 * DIRECT_URL is only required for `prisma migrate` / `prisma db push` (run
 * locally or in CI), not for runtime queries on Vercel. If it isn't set we
 * fall back to DATABASE_URL so the client can be instantiated without error.
 */
if (!process.env.DATABASE_URL_UNPOOLED && process.env.DATABASE_URL) {
  process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
