import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const servicios = await prisma.servicio.findMany({
      orderBy: { nombre_servicio: 'asc' },
    })
    return NextResponse.json(servicios)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener servicios', details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre_servicio, descripcion, precio_base, duracion_estimada_min, intervalo_km, intervalo_meses, estado } = body
    if (!nombre_servicio) return NextResponse.json({ error: 'Nombre de servicio es requerido' }, { status: 400 })

    const servicio = await prisma.servicio.create({
      data: { nombre_servicio, descripcion, precio_base, duracion_estimada_min, intervalo_km, intervalo_meses, estado: estado || 'Activo' },
    })
    return NextResponse.json(servicio, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear servicio', details: error.message }, { status: 500 })
  }
}
