import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id_orden: id },
      include: {
        vehiculo: {
          include: {
            cliente: {
              include: {
                usuario: true
              }
            },
          },
        },
        estado_actual: true,
        orden_servicios: {
          include: {
            servicio: true
          }
        },
        orden_repuestos: {
          include: {
            repuesto: true
          }
        }
      },
    })

    if (!orden) {
      return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })
    }

    return NextResponse.json(orden)
  } catch (error: any) {
    console.error('API Error /api/ordenes/[id]:', error)
    return NextResponse.json({ error: 'Error al obtener la orden' }, { status: 500 })
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

    const body = await request.json()
    const { motivo_ingreso, observaciones, id_estado_actual, id_mecanico, prioridad, kilometraje_ingreso } = body

    const data: any = {}
    if (motivo_ingreso) data.motivo_ingreso = motivo_ingreso
    if (observaciones !== undefined) data.observaciones = observaciones
    if (id_estado_actual) data.id_estado_actual = id_estado_actual
    if (id_mecanico !== undefined) data.id_mecanico = id_mecanico
    if (prioridad) data.prioridad = prioridad
    if (kilometraje_ingreso !== undefined) data.kilometraje_ingreso = kilometraje_ingreso

    const updatedOrden = await prisma.ordenTrabajo.update({
      where: { id_orden: id },
      data,
      include: {
        vehiculo: {
          include: {
            cliente: {
              include: {
                usuario: true
              }
            },
          },
        },
        estado_actual: true
      },
    })

    return NextResponse.json(updatedOrden)
  } catch (error: any) {
    console.error('API Error /api/ordenes/[id] PUT:', error)
    return NextResponse.json({ error: 'Error al actualizar la orden' }, { status: 500 })
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
    if (user.id_rol !== 1 && user.id_rol !== 2) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    await prisma.ordenTrabajo.delete({
      where: { id_orden: id },
    })

    return NextResponse.json({ message: 'Orden de trabajo eliminada correctamente' })
  } catch (error: any) {
    console.error('API Error /api/ordenes/[id] DELETE:', error)
    return NextResponse.json({ error: 'Error al eliminar la orden' }, { status: 500 })
  }
}
