import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
async function validarPermisoDiagnostico(user: any, idOrden: number) {
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
  if (!orden.id_mecanico) {
    return NextResponse.json(
      { error: 'Primero debes tomar esta orden antes de modificar el diagnóstico' },
      { status: 403 }
    )
  }
  if (orden.id_mecanico !== mecanico.id_mecanico) {
    return NextResponse.json(
      { error: 'No puedes modificar el diagnóstico de una orden asignada a otro mecánico' },
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
    const user = session.user as any
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const diagnostico = await prisma.diagnostico.findUnique({
      where: { id_diagnostico: id },
      include: {
        orden: {
          include: {
            estado_actual: true,
            mecanico: {
              include: {
                usuario: true,
              },
            },
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
    if (!diagnostico) {
      return NextResponse.json({ error: 'Diagnóstico no encontrado' }, { status: 404 })
    }
    if (user.id_rol === 3) {
      const permisoError = await validarPermisoDiagnostico(user, diagnostico.id_orden)
      if (permisoError) return permisoError
    }
    if (user.id_rol === 4) {
      const cliente = await prisma.cliente.findUnique({
        where: { id_usuario: Number(user.id_usuario) },
      })
      if (!cliente || diagnostico.orden.vehiculo.id_cliente !== cliente.id_cliente) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
      }
    }
    return NextResponse.json(diagnostico)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al obtener diagnóstico', details: error.message },
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
    const diagnosticoActual = await prisma.diagnostico.findUnique({
      where: { id_diagnostico: id },
      select: {
        id_diagnostico: true,
        id_orden: true,
      },
    })
    if (!diagnosticoActual) {
      return NextResponse.json({ error: 'Diagnóstico no encontrado' }, { status: 404 })
    }
    const permisoError = await validarPermisoDiagnostico(user, diagnosticoActual.id_orden)
    if (permisoError) return permisoError
    const body = await request.json()
    const { falla_reportada, causa_detectada, recomendacion, observaciones } = body
    if (!falla_reportada || falla_reportada.trim() === '') {
      return NextResponse.json(
        { error: 'La falla reportada es requerida' },
        { status: 400 }
      )
    }
    const diagnostico = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.diagnostico.update({
        where: { id_diagnostico: id },
        data: {
          falla_reportada,
          causa_detectada,
          recomendacion,
          observaciones,
        },
        include: {
          orden: {
            include: {
              estado_actual: true,
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
      await tx.historialEstadoOrden.create({
        data: {
          id_orden: diagnosticoActual.id_orden,
          id_estado: actualizado.orden.id_estado_actual,
          id_usuario: user.id_usuario ? Number(user.id_usuario) : null,
          comentario: `Diagnóstico actualizado: ${falla_reportada}`,
        },
      })
      return actualizado
    })
    return NextResponse.json(diagnostico)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al actualizar diagnóstico', details: error.message },
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
    const diagnosticoActual = await prisma.diagnostico.findUnique({
      where: { id_diagnostico: id },
      select: {
        id_diagnostico: true,
        id_orden: true,
        falla_reportada: true,
        orden: {
          select: {
            id_estado_actual: true,
          },
        },
      },
    })
    if (!diagnosticoActual) {
      return NextResponse.json({ error: 'Diagnóstico no encontrado' }, { status: 404 })
    }
    const permisoError = await validarPermisoDiagnostico(user, diagnosticoActual.id_orden)
    if (permisoError) return permisoError
    await prisma.$transaction(async (tx) => {
      await tx.diagnostico.delete({
        where: { id_diagnostico: id },
      })
      await tx.historialEstadoOrden.create({
        data: {
          id_orden: diagnosticoActual.id_orden,
          id_estado: diagnosticoActual.orden.id_estado_actual,
          id_usuario: user.id_usuario ? Number(user.id_usuario) : null,
          comentario: `Diagnóstico eliminado: ${diagnosticoActual.falla_reportada}`,
        },
      })
    })
    return NextResponse.json({ message: 'Diagnóstico eliminado correctamente' })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al eliminar diagnóstico', details: error.message },
      { status: 500 }
    )
  }
}