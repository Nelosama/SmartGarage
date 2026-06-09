import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const diagnostico = await prisma.diagnostico.findUnique({
      where: { id_diagnostico: id },
      include: { orden: true }
    })
    if (!diagnostico) return NextResponse.json({ error: 'Diagnostico no encontrado' }, { status: 404 })
    return NextResponse.json(diagnostico)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener diagnostico', details: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const body = await request.json()
    const { falla_reportada, causa_detectada, recomendacion, observaciones } = body

    const diagnostico = await prisma.diagnostico.update({
      where: { id_diagnostico: id },
      data: { falla_reportada, causa_detectada, recomendacion, observaciones },
    })
    return NextResponse.json(diagnostico)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar diagnostico', details: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    await prisma.diagnostico.delete({ where: { id_diagnostico: id } })
    return NextResponse.json({ message: 'Diagnostico eliminado' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar diagnostico', details: error.message }, { status: 500 })
  }
}
