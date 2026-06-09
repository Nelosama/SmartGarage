import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const estado = await prisma.estadoOrden.findUnique({ where: { id_estado: id } })
    if (!estado) return NextResponse.json({ error: 'Estado no encontrado' }, { status: 404 })
    return NextResponse.json(estado)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener estado', details: error.message }, { status: 500 })
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
    const { nombre_estado, descripcion } = body

    const estado = await prisma.estadoOrden.update({
      where: { id_estado: id },
      data: { nombre_estado, descripcion },
    })
    return NextResponse.json(estado)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar estado', details: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    await prisma.estadoOrden.delete({ where: { id_estado: id } })
    return NextResponse.json({ message: 'Estado eliminado' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar estado', details: error.message }, { status: 500 })
  }
}
