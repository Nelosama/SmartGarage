import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Prisma } from '@prisma/client'

async function obtenerEstadoDiagnostico(tx: any) {
  const estados = await tx.estadoOrden.findMany({
    where: {
      OR: [
        { nombre_estado: { equals: 'Diagnosticada', mode: 'insensitive' } },
        { nombre_estado: { equals: 'Diagnostico', mode: 'insensitive' } },
        { nombre_estado: { equals: 'En diagnostico', mode: 'insensitive' } },
        { nombre_estado: { equals: 'En reparación', mode: 'insensitive' } },
        { nombre_estado: { equals: 'En reparacion', mode: 'insensitive' } },
      ],
    },
  })

  const prioridad = [
    'diagnosticada',
    'diagnostico',
    'en diagnostico',
    'en reparación',
    'en reparacion',
  ]

  return estados.sort((a: any, b: any) => {
    const aIndex = prioridad.indexOf(a.nombre_estado.toLowerCase())
    const bIndex = prioridad.indexOf(b.nombre_estado.toLowerCase())
    return aIndex - bIndex
  })[0] || null
}

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
      { error: 'Primero debes tomar esta orden antes de registrar diagnóstico' },
      { status: 403 }
    )
  }

  if (orden.id_mecanico !== mecanico.id_mecanico) {
    return NextResponse.json(
      { error: 'No puedes diagnosticar una orden asignada a otro mecánico' },
      { status: 403 }
    )
  }

  return null
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as any
    const whereClause: Prisma.DiagnosticoWhereInput = {}

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
        vehiculo: {
          id_cliente: cliente.id_cliente,
        },
      }
    }

    const diagnosticos = await prisma.diagnostico.findMany({
      where: whereClause,
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
      orderBy: {
        id_diagnostico: 'desc',
      },
    })

    return NextResponse.json(diagnosticos)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al obtener diagnosticos', details: error.message },
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

    const {
      id_orden,
      falla_reportada,
      causa_detectada,
      recomendacion,
      observaciones,
    } = body

    const idOrdenNum = Number(id_orden)

    if (!idOrdenNum || !falla_reportada) {
      return NextResponse.json(
        { error: 'ID Orden y falla reportada son requeridos' },
        { status: 400 }
      )
    }

    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id_orden: idOrdenNum },
      select: {
        id_orden: true,
        id_estado_actual: true,
        id_mecanico: true,
      },
    })

    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    const permisoError = await validarPermisoDiagnostico(user, idOrdenNum)
    if (permisoError) return permisoError

    const result = await prisma.$transaction(async (tx) => {
      const diagnosticoExistente = await tx.diagnostico.findFirst({
        where: { id_orden: idOrdenNum },
      })

      const diagnostico = diagnosticoExistente
        ? await tx.diagnostico.update({
            where: { id_diagnostico: diagnosticoExistente.id_diagnostico },
            data: {
              falla_reportada,
              causa_detectada,
              recomendacion,
              observaciones,
            },
          })
        : await tx.diagnostico.create({
            data: {
              id_orden: idOrdenNum,
              falla_reportada,
              causa_detectada,
              recomendacion,
              observaciones,
            },
          })

      const estadoDiagnostico = await obtenerEstadoDiagnostico(tx)

      if (
        estadoDiagnostico &&
        Number(estadoDiagnostico.id_estado) !== Number(orden.id_estado_actual)
      ) {
        await tx.ordenTrabajo.update({
          where: { id_orden: idOrdenNum },
          data: {
            id_estado_actual: estadoDiagnostico.id_estado,
          },
        })

        await tx.historialEstadoOrden.create({
          data: {
            id_orden: idOrdenNum,
            id_estado: estadoDiagnostico.id_estado,
            id_usuario: user.id_usuario ? Number(user.id_usuario) : null,
            comentario: `Diagnóstico registrado: ${falla_reportada}`,
          },
        })
      }

      return diagnostico
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al crear diagnostico', details: error.message },
      { status: 500 }
    )
  }
}