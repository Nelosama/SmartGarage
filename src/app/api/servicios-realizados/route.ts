import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function recalcularFactura(tx: any, idOrden: number) {
  const serviciosOrden = await tx.ordenServicio.findMany({
    where: { id_orden: idOrden },
  })

  const repuestosOrden = await tx.ordenRepuesto.findMany({
    where: { id_orden: idOrden },
  })

  const subtotalServicios = serviciosOrden.reduce(
    (sum: number, s: any) => sum + Number(s.subtotal || 0),
    0
  )

  const subtotalRepuestos = repuestosOrden.reduce(
    (sum: number, r: any) => sum + Number(r.subtotal || 0),
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

  return factura
}

async function validarPermisoOrden(user: any, idOrden: number) {
  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id_orden: idOrden },
    select: {
      id_orden: true,
      id_mecanico: true,
    },
  })

  if (!orden) {
    return {
      error: NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 }),
      orden: null,
    }
  }

  if (user.id_rol === 3) {
    const mecanico = await prisma.mecanico.findUnique({
      where: { id_usuario: Number(user.id_usuario) },
    })

    if (!mecanico) {
      return {
        error: NextResponse.json({ error: 'Mecánico no encontrado' }, { status: 403 }),
        orden: null,
      }
    }

    if (!orden.id_mecanico) {
      return {
        error: NextResponse.json(
          { error: 'Primero debes tomar esta orden antes de registrar servicios o repuestos' },
          { status: 403 }
        ),
        orden: null,
      }
    }

    if (orden.id_mecanico !== mecanico.id_mecanico) {
      return {
        error: NextResponse.json(
          { error: 'No puedes registrar servicios o repuestos en una orden asignada a otro mecánico' },
          { status: 403 }
        ),
        orden: null,
      }
    }
  }

  return {
    error: null,
    orden,
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = session.user as { id_rol: number; id_usuario: string }
    const { searchParams } = new URL(request.url)

    const ordenIdParam = searchParams.get('ordenId')
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

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
        {
          observaciones: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          servicio: {
            nombre_servicio: {
              contains: query,
              mode: 'insensitive',
            },
          },
        },
      ]
    }

    const servicios = await prisma.ordenServicio.findMany({
      where: whereClause,
      take: limit,
      skip,
      select: {
        id_orden_servicio: true,
        id_orden: true,
        id_servicio: true,
        cantidad: true,
        precio_unitario: true,
        subtotal: true,
        observaciones: true,
        servicio: {
          select: {
            id_servicio: true,
            nombre_servicio: true,
          },
        },
        orden: {
          select: {
            id_orden: true,
            motivo_ingreso: true,
            vehiculo: {
              select: {
                placa: true,
                marca: true,
                modelo: true,
                cliente: {
                  select: {
                    usuario: {
                      select: {
                        nombre: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        id_orden_servicio: 'desc',
      },
    })

    return NextResponse.json(servicios)
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Error al obtener los servicios realizados',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = session.user as { id_rol: number; id_usuario: string }

    if (user.id_rol !== 1 && user.id_rol !== 2 && user.id_rol !== 3) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()

    const idOrden = Number(body.id_orden)
    const observaciones = body.observaciones || null

    const serviciosItems = Array.isArray(body.items)
      ? body.items
      : body.id_servicio
        ? [
            {
              id_servicio: body.id_servicio,
              cantidad: body.cantidad,
              precio_unitario: body.precio_unitario,
            },
          ]
        : []

    const repuestosItems = Array.isArray(body.repuestos)
      ? body.repuestos
      : body.id_repuesto
        ? [
            {
              id_repuesto: body.id_repuesto,
              cantidad: body.cantidad_repuesto || body.cantidad,
              precio_unitario: body.precio_unitario_repuesto || body.precio_unitario,
            },
          ]
        : []

    if (!idOrden) {
      return NextResponse.json(
        { error: 'La orden es requerida' },
        { status: 400 }
      )
    }

    if (serviciosItems.length === 0 && repuestosItems.length === 0) {
      return NextResponse.json(
        { error: 'Debes registrar al menos un servicio o un repuesto' },
        { status: 400 }
      )
    }

    const permiso = await validarPermisoOrden(user, idOrden)

    if (permiso.error) return permiso.error

    const result = await prisma.$transaction(async (tx) => {
      const serviciosGuardados = []
      const repuestosGuardados = []

      for (const item of serviciosItems) {
        const idServicio = Number(item.id_servicio)
        const cantidad = Number(item.cantidad) || 1
        const precioUnitario = Number(item.precio_unitario) || 0

        if (!idServicio || cantidad <= 0 || precioUnitario < 0) {
          throw new Error('Datos inválidos en uno de los servicios')
        }

        const servicioExistente = await tx.servicio.findUnique({
          where: { id_servicio: idServicio },
        })

        if (!servicioExistente) {
          throw new Error('Uno de los servicios seleccionados no existe')
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

      for (const item of repuestosItems) {
        const idRepuesto = Number(item.id_repuesto)
        const cantidad = Number(item.cantidad) || 1
        const precioUnitario = Number(item.precio_unitario) || 0

        if (!idRepuesto || cantidad <= 0 || precioUnitario < 0) {
          throw new Error('Datos inválidos en uno de los repuestos')
        }

        const repuesto = await tx.repuesto.findUnique({
          where: { id_repuesto: idRepuesto },
        })

        if (!repuesto) {
          throw new Error('Uno de los repuestos seleccionados no existe')
        }

        const repuestoActualEnOrden = await tx.ordenRepuesto.findUnique({
          where: {
            id_orden_id_repuesto: {
              id_orden: idOrden,
              id_repuesto: idRepuesto,
            },
          },
        })

        const cantidadActual = Number(repuestoActualEnOrden?.cantidad || 0)
        const diferenciaStock = cantidad - cantidadActual

        if (diferenciaStock > 0 && Number(repuesto.stock) < diferenciaStock) {
          throw new Error(
            `Stock insuficiente para ${repuesto.nombre_repuesto}. Disponible: ${repuesto.stock}, requerido adicional: ${diferenciaStock}`
          )
        }

        const repuestoGuardado = await tx.ordenRepuesto.upsert({
          where: {
            id_orden_id_repuesto: {
              id_orden: idOrden,
              id_repuesto: idRepuesto,
            },
          },
          update: {
            cantidad,
            precio_unitario: precioUnitario,
          },
          create: {
            id_orden: idOrden,
            id_repuesto: idRepuesto,
            cantidad,
            precio_unitario: precioUnitario,
          },
          include: {
            orden: true,
            repuesto: true,
          },
        })

        if (diferenciaStock > 0) {
          await tx.repuesto.update({
            where: { id_repuesto: idRepuesto },
            data: {
              stock: {
                decrement: diferenciaStock,
              },
            },
          })
        }

        if (diferenciaStock < 0) {
          await tx.repuesto.update({
            where: { id_repuesto: idRepuesto },
            data: {
              stock: {
                increment: Math.abs(diferenciaStock),
              },
            },
          })
        }

        repuestosGuardados.push(repuestoGuardado)
      }

      const factura = await recalcularFactura(tx, idOrden)

      return {
        servicios: serviciosGuardados,
        repuestos: repuestosGuardados,
        factura,
      }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Error al crear los servicios/repuestos realizados',
        details: error.message,
      },
      { status: 500 }
    )
  }
}