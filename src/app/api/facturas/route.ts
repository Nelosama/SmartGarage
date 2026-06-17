import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Prisma } from '@prisma/client'

interface AuthUser {
  id_rol: number
  id_usuario: string
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as AuthUser

    if (user.id_rol === 1 || user.id_rol === 2) {
      const facturas = await prisma.resumenFactura.findMany({
        orderBy: { fecha_emision: 'desc' },
      })
      return NextResponse.json(facturas)
    }

    if (user.id_rol === 4) {
      const cliente = await prisma.cliente.findUnique({
        where: { id_usuario: parseInt(user.id_usuario) },
      })

      if (cliente) {
        const ordenesDelCliente = await prisma.ordenTrabajo.findMany({
          where: { id_cliente: cliente.id_cliente },
          select: { id_orden: true },
        })
        const idsOrdenes = ordenesDelCliente.map((o) => o.id_orden)

        const facturas = await prisma.resumenFactura.findMany({
          where: {
            id_orden: { in: idsOrdenes },
          },
          orderBy: { fecha_emision: 'desc' },
        })
        return NextResponse.json(facturas)
      }
      return NextResponse.json([])
    }

    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: 'Error al obtener facturas', details: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as AuthUser
    if (user.id_rol !== 1 && user.id_rol !== 2) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const {
      id_orden,
      numero_factura,
      subtotal_servicios,
      subtotal_repuestos,
      impuesto,
      descuento,
      estado_pago,
      metodo_pago,
    } = body

    if (!id_orden || !numero_factura) {
      return NextResponse.json({ error: 'ID Orden y número de factura son requeridos' }, { status: 400 })
    }

    const existingFactura = await prisma.factura.findUnique({
      where: { numero_factura },
    })
    if (existingFactura) {
      return NextResponse.json({ error: 'El número de factura ya existe' }, { status: 400 })
    }

    const existingOrder = await prisma.ordenTrabajo.findUnique({
      where: { id_orden: parseInt(id_orden) },
    })
    if (!existingOrder) {
      return NextResponse.json({ error: 'La orden no existe' }, { status: 400 })
    }

    const sServ = Number(subtotal_servicios) || 0
    const sRep = Number(subtotal_repuestos) || 0
    const imp = Number(impuesto) || 0
    const desc = Number(descuento) || 0
    const calculatedTotal = sServ + sRep + imp - desc

    const factura = await prisma.factura.create({
      data: {
        id_orden: parseInt(id_orden),
        numero_factura,
        subtotal_servicios: new Prisma.Decimal(sServ),
        subtotal_repuestos: new Prisma.Decimal(sRep),
        impuesto: new Prisma.Decimal(imp),
        descuento: new Prisma.Decimal(desc),
        total: new Prisma.Decimal(calculatedTotal),
        estado_pago: estado_pago || 'Pendiente',
        metodo_pago,
      },
    })

    return NextResponse.json(factura, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: 'Error al crear factura', details: message }, { status: 500 })
  }
}
