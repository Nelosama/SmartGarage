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

  await tx.factura.upsert({
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
}

async function validarPermisoOrden(user: any, idOrden: number) {
  if (user.id_rol !== 3) return null

  const mecanico = await prisma.mecanico.findUnique({
    where: { id_usuario: Number(user.id_usuario) },
  })

  if (!mecanico) {
    return NextResponse.json({ error: 'Mecánico no encontrado' }, { status: 403 })
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

  if (orden.id_mecanico !== mecanico.id_mecanico) {
    return NextResponse.json(
      { error: 'No puedes modificar repuestos de una orden asignada a otro mecánico' },
      { status: 403 }
    )
  }

  return null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const item = await prisma.ordenRepuesto.findUnique({
      where: { id_orden_repuesto: id },
      include: {
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
            mecanico: {
              include: {
                usuario: true,
              },
            },
          },
        },
        repuesto: true,
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al obtener repuesto de orden', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as any

    if (user.id_rol !== 1 && user.id_rol !== 2 && user.id_rol !== 3) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const itemActual = await prisma.ordenRepuesto.findUnique({
      where: { id_orden_repuesto: id },
      select: {
        id_orden_repuesto: true,
        id_orden: true,
        id_repuesto: true,
        cantidad: true,
      },
    })

    if (!itemActual) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
    }

    const permisoError = await validarPermisoOrden(user, itemActual.id_orden)
    if (permisoError) return permisoError

    const body = await request.json()
    const { cantidad, precio_unitario } = body

    const data: any = {}

    if (cantidad !== undefined) {
      const nuevaCantidad = Number(cantidad)

      if (nuevaCantidad <= 0) {
        return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 })
      }

      data.cantidad = nuevaCantidad
    }

    if (precio_unitario !== undefined) {
      const nuevoPrecio = Number(precio_unitario)

      if (nuevoPrecio < 0) {
        return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
      }

      data.precio_unitario = nuevoPrecio
    }

    const item = await prisma.$transaction(async (tx) => {
      if (data.cantidad !== undefined) {
        const diferencia = Number(data.cantidad) - Number(itemActual.cantidad)

        if (diferencia > 0) {
          const repuesto = await tx.repuesto.findUnique({
            where: { id_repuesto: itemActual.id_repuesto },
          })

          if (!repuesto) {
            throw new Error('Repuesto no encontrado')
          }

          if (repuesto.stock < diferencia) {
            throw new Error('Stock insuficiente para aumentar la cantidad')
          }

          await tx.repuesto.update({
            where: { id_repuesto: itemActual.id_repuesto },
            data: {
              stock: {
                decrement: diferencia,
              },
            },
          })
        }

        if (diferencia < 0) {
          await tx.repuesto.update({
            where: { id_repuesto: itemActual.id_repuesto },
            data: {
              stock: {
                increment: Math.abs(diferencia),
              },
            },
          })
        }
      }

      const actualizado = await tx.ordenRepuesto.update({
        where: { id_orden_repuesto: id },
        data,
        include: {
          orden: true,
          repuesto: true,
        },
      })

      await recalcularFactura(tx, itemActual.id_orden)

      return actualizado
    })

    return NextResponse.json(item)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al actualizar repuesto de orden', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as any

    if (user.id_rol !== 1 && user.id_rol !== 2 && user.id_rol !== 3) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const itemActual = await prisma.ordenRepuesto.findUnique({
      where: { id_orden_repuesto: id },
      select: {
        id_orden_repuesto: true,
        id_orden: true,
        id_repuesto: true,
        cantidad: true,
      },
    })

    if (!itemActual) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
    }

    const permisoError = await validarPermisoOrden(user, itemActual.id_orden)
    if (permisoError) return permisoError

    await prisma.$transaction(async (tx) => {
      await tx.ordenRepuesto.delete({
        where: { id_orden_repuesto: id },
      })

      await tx.repuesto.update({
        where: { id_repuesto: itemActual.id_repuesto },
        data: {
          stock: {
            increment: Number(itemActual.cantidad),
          },
        },
      })

      await recalcularFactura(tx, itemActual.id_orden)
    })

    return NextResponse.json({ message: 'Registro eliminado y stock devuelto correctamente' })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al eliminar repuesto de orden', details: error.message },
      { status: 500 }
    )
  }
}