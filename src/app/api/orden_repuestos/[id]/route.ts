import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const item = await prisma.ordenRepuesto.findUnique({
      where: { id_orden_repuesto: id },
      include: { orden: true, repuesto: true }
    })
    if (!item) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
    return NextResponse.json(item)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener repuesto de orden', details: error.message }, { status: 500 })
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
    const { cantidad, precio_unitario } = body

    const current = await prisma.ordenRepuesto.findUnique({ where: { id_orden_repuesto: id } })
    const newQty = cantidad !== undefined ? cantidad : current?.cantidad
    const newPrice = precio_unitario !== undefined ? precio_unitario : current?.precio_unitario
    const subtotal = Number(newQty) * Number(newPrice)

    const item = await prisma.ordenRepuesto.update({
      where: { id_orden_repuesto: id },
      data: { cantidad, precio_unitario, subtotal },
    })
    return NextResponse.json(item)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar repuesto de orden', details: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    await prisma.ordenRepuesto.delete({ where: { id_orden_repuesto: id } })
    return NextResponse.json({ message: 'Registro eliminado' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar repuesto de orden', details: error.message }, { status: 500 })
  }
}
