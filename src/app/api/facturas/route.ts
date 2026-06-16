import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Prisma } from '@prisma/client'

interface UserSession {
  id_rol: number
  id_usuario: string
  nombre: string
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as UserSession
    const id_rol = Number(user.id_rol)

    let whereClause: Prisma.ResumenFacturaWhereInput = {}

    if (id_rol === 4) { // Cliente
      const cliente = await prisma.cliente.findUnique({
        where: { id_usuario: Number(user.id_usuario) }
      })

      if (!cliente) {
        return NextResponse.json([])
      }

      const ordenesCliente = await prisma.ordenTrabajo.findMany({
        where: { id_cliente: cliente.id_cliente },
        select: { id_orden: true }
      })
      const idsOrdenes = ordenesCliente.map(o => o.id_orden)
      whereClause = { id_orden: { in: idsOrdenes } }
    } else if (id_rol !== 1 && id_rol !== 2) {
      return NextResponse.json({ error: 'No autorizado para ver facturas' }, { status: 403 })
    }

    const facturas = await prisma.resumenFactura.findMany({
      where: whereClause,
      orderBy: { fecha_emision: 'desc' },
    })

    return NextResponse.json(facturas)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: 'Error al obtener facturas', details: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as UserSession
    const id_rol = Number(user.id_rol)

    if (id_rol !== 1 && id_rol !== 2) {
      return NextResponse.json({ error: 'No autorizado para crear facturas' }, { status: 403 })
    }

    const body = await request.json()
    const {
      id_orden,
      numero_factura,
      subtotal_servicios,
      subtotal_repuestos,
      impuesto,
      descuento,
      total,
      estado_pago,
      metodo_pago
    } = body

    if (!id_orden || !numero_factura) {
      return NextResponse.json({ error: 'ID Orden y número de factura son requeridos' }, { status: 400 })
    }

    // Validar que numero_factura sea único
    const facturaExistente = await prisma.factura.findUnique({
      where: { numero_factura }
    })
    if (facturaExistente) {
      return NextResponse.json({ error: 'El número de factura ya existe' }, { status: 400 })
    }

    // Validar que la orden exista
    const ordenExistente = await prisma.ordenTrabajo.findUnique({
      where: { id_orden: Number(id_orden) }
    })
    if (!ordenExistente) {
      return NextResponse.json({ error: 'La orden de trabajo no existe' }, { status: 400 })
    }

    const factura = await prisma.factura.create({
      data: {
        id_orden: Number(id_orden),
        numero_factura,
        subtotal_servicios: Number(subtotal_servicios),
        subtotal_repuestos: Number(subtotal_repuestos),
        impuesto: Number(impuesto),
        descuento: Number(descuento),
        total: Number(total),
        estado_pago: estado_pago || 'Pendiente',
        metodo_pago
      },
    })
    return NextResponse.json(factura, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: 'Error al crear factura', details: msg }, { status: 500 })
  }
}
