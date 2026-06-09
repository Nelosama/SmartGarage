import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const historial = await prisma.historialEstadoOrden.findMany({
      include: { orden: true, estado: true, usuario: true },
      orderBy: { fecha_hora: 'desc' },
    })
    return NextResponse.json(historial)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener historial', details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id_orden, id_estado, id_usuario, comentario } = body
    if (!id_orden || !id_estado) return NextResponse.json({ error: 'ID Orden y ID Estado son requeridos' }, { status: 400 })

    const item = await prisma.historialEstadoOrden.create({
      data: { id_orden, id_estado, id_usuario, comentario },
    })
    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear historial', details: error.message }, { status: 500 })
  }
}
