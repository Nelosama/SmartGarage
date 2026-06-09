import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const factura = await prisma.factura.findUnique({
      where: { id_factura: id },
      include: { orden: true }
    })
    if (!factura) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    return NextResponse.json(factura)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener factura', details: error.message }, { status: 500 })
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
    const { numero_factura, subtotal_servicios, subtotal_repuestos, impuesto, descuento, total, estado_pago, metodo_pago } = body

    const factura = await prisma.factura.update({
      where: { id_factura: id },
      data: { numero_factura, subtotal_servicios, subtotal_repuestos, impuesto, descuento, total, estado_pago, metodo_pago },
    })
    return NextResponse.json(factura)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar factura', details: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    await prisma.factura.delete({ where: { id_factura: id } })
    return NextResponse.json({ message: 'Factura eliminada' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar factura', details: error.message }, { status: 500 })
  }
}
