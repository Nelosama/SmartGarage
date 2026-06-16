import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as any
    const { searchParams } = new URL(request.url)
    const ordenIdParam = searchParams.get('ordenId')
    const query = searchParams.get('q') || ''

    const whereClause: any = {}

    if (ordenIdParam) {
      const id_orden = parseInt(ordenIdParam, 10)
      if (!isNaN(id_orden)) whereClause.id_orden = id_orden
    }

    if (user.id_rol === 3) {
      const mecanico = await prisma.mecanico.findUnique({
        where: { id_usuario: Number(user.id_usuario) },
      })

      if (!mecanico) return NextResponse.json([])

      whereClause.orden = {
        id_mecanico: mecanico.id_mecanico,
      }
    }

    if (user.id_rol === 4) {
      const cliente = await prisma.cliente.findUnique({
        where: { id_usuario: Number(user.id_usuario) },
      })

      if (!cliente) return NextResponse.json([])

      whereClause.orden = {
        id_cliente: cliente.id_cliente,
      }
    }

    if (query) {
      whereClause.OR = [
        { observaciones: { contains: query, mode: 'insensitive' } },
        {
          servicio: {
            nombre_servicio: { contains: query, mode: 'insensitive' },
          },
        },
      ]
    }

    const servicios = await prisma.ordenServicio.findMany({
      where: whereClause,
      include: {
        servicio: true,
        orden: {
          include: {
            vehiculo: {
              include: {
                cliente: {
                  include: {
                    usuario: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { id_orden_servicio: 'desc' },
    })

    return NextResponse.json(servicios)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al obtener los servicios realizados', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as any

    if (user.id_rol !== 1 && user.id_rol !== 2 && user.id_rol !== 3) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()

    const idOrden = Number(body.id_orden)
    const observaciones = body.observaciones || null

    const items = Array.isArray(body.items)
      ? body.items
      : [
          {
            id_servicio: body.id_servicio,
            cantidad: body.cantidad,
            precio_unitario: body.precio_unitario,
          },
        ]

    if (!idOrden || items.length === 0) {
      return NextResponse.json(
        { error: 'Orden y servicios son requeridos' },
        { status: 400 }
      )
    }

    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id_orden: idOrden },
      select: {
        id_orden: true,
        id_mecanico: true,
      },
    })

    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    if (user.id_rol === 3) {
      const mecanico = await prisma.mecanico.findUnique({
        where: { id_usuario: Number(user.id_usuario) },
      })

      if (!mecanico) {
        return NextResponse.json({ error: 'Mecánico no encontrado' }, { status: 403 })
      }

      if (!orden.id_mecanico) {
        return NextResponse.json(
          { error: 'Primero debes tomar esta orden antes de registrar servicios' },
          { status: 403 }
        )
      }

      if (orden.id_mecanico !== mecanico.id_mecanico) {
        return NextResponse.json(
          { error: 'No puedes registrar servicios en una orden asignada a otro mecánico' },
          { status: 403 }
        )
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const serviciosGuardados = []

      for (const item of items) {
        const idServicio = Number(item.id_servicio)
        const cantidad = Number(item.cantidad) || 1
        const precioUnitario = Number(item.precio_unitario) || 0

        if (!idServicio || cantidad <= 0 || precioUnitario < 0) {
          throw new Error('Datos inválidos en uno de los servicios')
        }

        const servicioGuardado = await tx.ordenServicio.upsert({
          where: {
            id_orden_id_servicio: {
              id_orden: idOrden,
              id_servicio: idServicio,
            },
          },
          update: {
            cantidad,
            precio_unitario: precioUnitario,
            observaciones,
          },
          create: {
            id_orden: idOrden,
            id_servicio: idServicio,
            cantidad,
            precio_unitario: precioUnitario,
            observaciones,
          },
          include: {
            servicio: true,
            orden: true,
          },
        })

        serviciosGuardados.push(servicioGuardado)
      }

      const serviciosOrden = await tx.ordenServicio.findMany({
        where: { id_orden: idOrden },
      })

      const repuestosOrden = await tx.ordenRepuesto.findMany({
        where: { id_orden: idOrden },
      })

      const subtotalServicios = serviciosOrden.reduce(
        (sum, s) => sum + Number(s.subtotal || 0),
        0
      )

      const subtotalRepuestos = repuestosOrden.reduce(
        (sum, r) => sum + Number(r.subtotal || 0),
        0
      )

      const impuesto = Number(((subtotalServicios + subtotalRepuestos) * 0.15).toFixed(2))
      const total = Number((subtotalServicios + subtotalRepuestos + impuesto).toFixed(2))

      const factura = await tx.factura.upsert({
        where: { id_orden: idOrden },
        update: {
          subtotal_servicios: subtotalServicios,
          subtotal_repuestos: subtotalRepuestos,
          impuesto,
          total,
          estado_pago: 'Pendiente',
        },
        create: {
          id_orden: idOrden,
          numero_factura: `FAC-${idOrden}-${Date.now()}`,
          subtotal_servicios: subtotalServicios,
          subtotal_repuestos: subtotalRepuestos,
          impuesto,
          descuento: 0,
          total,
          estado_pago: 'Pendiente',
        },
      })

      return {
        servicios: serviciosGuardados,
        factura,
      }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al crear los servicios realizados', details: error.message },
      { status: 500 }
    )
  }
}