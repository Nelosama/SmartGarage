import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const repuesto = await prisma.repuesto.findUnique({ where: { id_repuesto: id } })
    if (!repuesto) return NextResponse.json({ error: 'Repuesto no encontrado' }, { status: 404 })
    return NextResponse.json(repuesto)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener repuesto', details: error.message }, { status: 500 })
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
    const { nombre_repuesto, marca, descripcion, stock, precio_unitario, stock_minimo, estado } = body
    const repuesto = await prisma.repuesto.update({
      where: { id_repuesto: id },
      data: { nombre_repuesto, marca, descripcion, stock, precio_unitario, stock_minimo, estado },
    })
    return NextResponse.json(repuesto)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar repuesto', details: error.message }, { status: 500 })
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    await prisma.repuesto.delete({ where: { id_repuesto: id } })
    return NextResponse.json({ message: 'Repuesto eliminado' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar repuesto', details: error.message }, { status: 500 })
  }
}