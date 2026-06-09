import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const facturas = await prisma.factura.findMany({
      include: { orden: true },
      orderBy: { fecha_emision: 'desc' },
    })
    return NextResponse.json(facturas)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener facturas', details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id_orden, numero_factura, subtotal_servicios, subtotal_repuestos, impuesto, descuento, total, estado_pago, metodo_pago } = body
    if (!id_orden || !numero_factura) return NextResponse.json({ error: 'ID Orden y numero de factura son requeridos' }, { status: 400 })

    const factura = await prisma.factura.create({
      data: { id_orden, numero_factura, subtotal_servicios, subtotal_repuestos, impuesto, descuento, total, estado_pago: estado_pago || 'Pendiente', metodo_pago },
    })
    return NextResponse.json(factura, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear factura', details: error.message }, { status: 500 })
  }
}
