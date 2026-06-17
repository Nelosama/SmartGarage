import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id_orden: id },
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
        estado_actual: true,
        mecanico: {
          include: {
            usuario: true,
          },
        },
        orden_servicios: {
          include: {
            servicio: true,
          },
        },
        orden_repuestos: {
          include: {
            repuesto: true,
          },
        },
        historial_estados: {
          include: {
            estado: true,
            usuario: true,
          },
          orderBy: {
            fecha_hora: 'desc',
          },
        },
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
    const {
      motivo_ingreso,
      observaciones,
      id_estado_actual,
      id_mecanico,
      prioridad,
      kilometraje_ingreso,
      fecha_ingreso,
      fecha_estimada_entrega,
    } = body
    const ordenAnterior = await prisma.ordenTrabajo.findUnique({
      where: { id_orden: id },
      select: {
        id_orden: true,
        id_estado_actual: true,
        id_mecanico: true,
      },
    })
    if (!ordenAnterior) {
      return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })
    }
    let mecanicoActual: any = null
    if (user.id_rol === 3) {
      mecanicoActual = await prisma.mecanico.findUnique({
        where: { id_usuario: Number(user.id_usuario) },
      })
      if (!mecanicoActual) {
        return NextResponse.json({ error: 'Mecánico no encontrado' }, { status: 403 })
      }
      const ordenSinAsignar = ordenAnterior.id_mecanico === null
      const ordenAsignadaAlMecanico = ordenAnterior.id_mecanico === mecanicoActual.id_mecanico
      if (!ordenSinAsignar && !ordenAsignadaAlMecanico) {
        return NextResponse.json(
          { error: 'Esta orden ya está asignada a otro mecánico' },
          { status: 403 }
        )
      }
      if (
        id_mecanico !== undefined &&
        id_mecanico !== null &&
        Number(id_mecanico) !== mecanicoActual.id_mecanico
      ) {
        return NextResponse.json(
          { error: 'No puedes asignar esta orden a otro mecánico' },
          { status: 403 }
        )
      }
    }
    const data: any = {}
    if (motivo_ingreso !== undefined) data.motivo_ingreso = motivo_ingreso
    if (observaciones !== undefined) data.observaciones = observaciones
    if (id_estado_actual !== undefined && id_estado_actual !== null && id_estado_actual !== '') {
      data.id_estado_actual = Number(id_estado_actual)
    }
    if (id_mecanico !== undefined) {
      data.id_mecanico = id_mecanico ? Number(id_mecanico) : null
    }
    if (prioridad !== undefined) data.prioridad = prioridad
    if (kilometraje_ingreso !== undefined) data.kilometraje_ingreso = Number(kilometraje_ingreso)
    if (fecha_ingreso !== undefined) {
      data.fecha_ingreso = fecha_ingreso ? new Date(fecha_ingreso) : undefined
    }
    if (fecha_estimada_entrega !== undefined) {
      data.fecha_estimada_entrega = fecha_estimada_entrega
        ? new Date(fecha_estimada_entrega)
        : null
    }
    const estadoCambio =
      id_estado_actual !== undefined &&
      id_estado_actual !== null &&
      id_estado_actual !== '' &&
      Number(id_estado_actual) !== Number(ordenAnterior.id_estado_actual)
    const updatedOrden = await prisma.$transaction(async (tx) => {
      const ordenActualizada = await tx.ordenTrabajo.update({
        where: { id_orden: id },
        data,
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
          estado_actual: true,
          mecanico: {
            include: {
              usuario: true,
            },
          },
        },
      })
      if (estadoCambio) {
        await tx.historialEstadoOrden.create({
          data: {
            id_orden: id,
            id_estado: Number(id_estado_actual),
            id_usuario: user.id_usuario ? Number(user.id_usuario) : null,
            comentario:
              observaciones && observaciones.trim() !== ''
                ? observaciones
                : `Estado actualizado a: ${ordenActualizada.estado_actual.nombre_estado}`,
          },
        })
      }
      return ordenActualizada
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