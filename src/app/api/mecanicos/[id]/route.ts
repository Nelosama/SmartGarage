import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const mecanico = await prisma.mecanico.findUnique({
      where: { id_mecanico: id },
      include: { usuario: true }
    })
    if (!mecanico) return NextResponse.json({ error: 'Mecanico no encontrado' }, { status: 404 })
    return NextResponse.json(mecanico)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener mecanico', details: error.message }, { status: 500 })
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
    const { especialidad, estado } = body

    const mecanico = await prisma.mecanico.update({
      where: { id_mecanico: id },
      data: { especialidad, estado },
    })
    return NextResponse.json(mecanico)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar mecanico', details: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    await prisma.mecanico.delete({ where: { id_mecanico: id } })
    return NextResponse.json({ message: 'Mecanico eliminado' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar mecanico', details: error.message }, { status: 500 })
  }
}
