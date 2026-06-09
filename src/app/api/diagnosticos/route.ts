import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const diagnosticos = await prisma.diagnostico.findMany({
      include: { orden: true },
    })
    return NextResponse.json(diagnosticos)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener diagnosticos', details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id_orden, falla_reportada, causa_detectada, recomendacion, observaciones } = body
    if (!id_orden || !falla_reportada) return NextResponse.json({ error: 'ID Orden y falla reportada son requeridos' }, { status: 400 })

    const diagnostico = await prisma.diagnostico.create({
      data: { id_orden, falla_reportada, causa_detectada, recomendacion, observaciones },
    })
    return NextResponse.json(diagnostico, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear diagnostico', details: error.message }, { status: 500 })
  }
}
