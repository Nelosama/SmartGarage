import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const roles = await prisma.rol.findMany({
      orderBy: { id_rol: 'asc' }
    })
    return NextResponse.json(roles)
  } catch (error) {
    console.error('GET /api/roles error:', error)
    return NextResponse.json({ error: 'Error al obtener roles' }, { status: 500 })
  }
}
