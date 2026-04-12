import { PrismaClient } from '@prisma/client'

/**
 * Prisma client singleton.
 *
 * Next.js hot-reloads modules in development, which would normally create a
 * new PrismaClient (and open a new connection pool) on every code change.
 * Attaching the instance to `globalThis` ensures we reuse the same client
 * across reloads while still getting a fresh client in production.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
