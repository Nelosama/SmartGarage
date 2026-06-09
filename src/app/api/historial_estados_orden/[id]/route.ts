import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const item = await prisma.historialEstadoOrden.findUnique({
      where: { id_historial_estado: id },
      include: { orden: true, estado: true, usuario: true }
    })
    if (!item) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
    return NextResponse.json(item)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener historial', details: error.message }, { status: 500 })
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
    const { id_estado, id_usuario, comentario } = body

    const item = await prisma.historialEstadoOrden.update({
      where: { id_historial_estado: id },
      data: { id_estado, id_usuario, comentario },
    })
    return NextResponse.json(item)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar historial', details: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    await prisma.historialEstadoOrden.delete({ where: { id_historial_estado: id } })
    return NextResponse.json({ message: 'Registro eliminado' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar historial', details: error.message }, { status: 500 })
  }
}
