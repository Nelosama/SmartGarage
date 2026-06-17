import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export async function GET() {
  try {
    /* OPTIMIZACIÓN: Cache simple para estados de orden ya que son cuasi-estáticos */
    const estados = await prisma.estadoOrden.findMany({
      orderBy: { nombre_estado: 'asc' },
    })
    return NextResponse.json(estados, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener estados', details: error.message }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre_estado, descripcion } = body
    if (!nombre_estado) return NextResponse.json({ error: 'Nombre de estado es requerido' }, { status: 400 })
    const estado = await prisma.estadoOrden.create({
      data: { nombre_estado, descripcion },
    })
    return NextResponse.json(estado, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear estado', details: error.message }, { status: 500 })
  }
}