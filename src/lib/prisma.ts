import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL no está definida en las variables de entorno.')
  }

  // Configuración del pool para PostgreSQL con soporte SSL (necesario para Supabase)
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Permite conexiones SSL incluso con certificados auto-firmados
    }
  })

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
