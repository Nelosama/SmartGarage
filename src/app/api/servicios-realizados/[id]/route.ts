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

async function validarPermisoMecanico(user: any, idOrden: number) {
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
      { error: 'No puedes modificar servicios de una orden asignada a otro mecánico' },
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

    const servicio = await prisma.ordenServicio.findUnique({
      where: { id_orden_servicio: id },
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
    })

    if (!servicio) {
      return NextResponse.json({ error: 'Servicio realizado no encontrado' }, { status: 404 })
    }

    return NextResponse.json(servicio)
  } catch (error: any) {
    console.error('API Error /api/servicios-realizados/[id]:', error)
    return NextResponse.json({ error: 'Error al obtener el servicio realizado' }, { status: 500 })
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

    const servicioActual = await prisma.ordenServicio.findUnique({
      where: { id_orden_servicio: id },
      select: {
        id_orden_servicio: true,
        id_orden: true,
      },
    })

    if (!servicioActual) {
      return NextResponse.json({ error: 'Servicio realizado no encontrado' }, { status: 404 })
    }

    const permisoError = await validarPermisoMecanico(user, servicioActual.id_orden)
    if (permisoError) return permisoError

    const body = await request.json()
    const { id_servicio, id_orden, cantidad, precio_unitario, observaciones } = body

    if (id_orden && Number(id_orden) !== Number(servicioActual.id_orden)) {
      const permisoNuevaOrden = await validarPermisoMecanico(user, Number(id_orden))
      if (permisoNuevaOrden) return permisoNuevaOrden
    }

    const data: any = {}

    if (id_servicio !== undefined) data.id_servicio = Number(id_servicio)
    if (id_orden !== undefined) data.id_orden = Number(id_orden)
    if (cantidad !== undefined) data.cantidad = Number(cantidad)
    if (precio_unitario !== undefined) data.precio_unitario = Number(precio_unitario)
    if (observaciones !== undefined) data.observaciones = observaciones

    const updatedServicio = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.ordenServicio.update({
        where: { id_orden_servicio: id },
        data,
        include: {
          servicio: true,
          orden: true,
        },
      })

      await recalcularFactura(tx, servicioActual.id_orden)

      if (id_orden && Number(id_orden) !== Number(servicioActual.id_orden)) {
        await recalcularFactura(tx, Number(id_orden))
      }

      return actualizado
    })

    return NextResponse.json(updatedServicio)
  } catch (error: any) {
    console.error('API Error /api/servicios-realizados/[id] PUT:', error)
    return NextResponse.json({ error: 'Error al actualizar el servicio realizado' }, { status: 500 })
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

    const servicioActual = await prisma.ordenServicio.findUnique({
      where: { id_orden_servicio: id },
      select: {
        id_orden_servicio: true,
        id_orden: true,
      },
    })

    if (!servicioActual) {
      return NextResponse.json({ error: 'Servicio realizado no encontrado' }, { status: 404 })
    }

    const permisoError = await validarPermisoMecanico(user, servicioActual.id_orden)
    if (permisoError) return permisoError

    await prisma.$transaction(async (tx) => {
      await tx.ordenServicio.delete({
        where: { id_orden_servicio: id },
      })

      await recalcularFactura(tx, servicioActual.id_orden)
    })

    return NextResponse.json({ message: 'Servicio realizado eliminado correctamente' })
  } catch (error: any) {
    console.error('API Error /api/servicios-realizados/[id] DELETE:', error)
    return NextResponse.json({ error: 'Error al eliminar el servicio realizado' }, { status: 500 })
  }
}