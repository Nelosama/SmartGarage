import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as any
    const whereClause: Prisma.FacturaWhereInput = {}

    if (user.id_rol === 4) { // Cliente
      const cliente = await prisma.cliente.findUnique({ where: { id_usuario: parseInt(user.id_usuario) } })
      if (cliente) {
        whereClause.orden = { id_cliente: cliente.id_cliente }
      } else {
        return NextResponse.json([])
      }
    }

    const facturas = await prisma.factura.findMany({
      where: whereClause,
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
