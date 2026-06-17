import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Prisma } from '@prisma/client'

interface AuthUser {
  id_rol: number
  id_usuario: string
}

async function obtenerMecanicoDelUsuario(idUsuario: string) {
  return prisma.mecanico.findUnique({
    where: {
      id_usuario: Number(idUsuario),
    },
  })
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = session.user as AuthUser
    const roleId = Number(user.id_rol)

    const whereClause: Prisma.AlertaMantenimientoWhereInput = {}

    if (roleId === 4) {
      const cliente = await prisma.cliente.findUnique({
        where: {
          id_usuario: Number(user.id_usuario),
        },
      })

      if (!cliente) return NextResponse.json([])

      whereClause.vehiculo = {
        id_cliente: cliente.id_cliente,
      }
    }

    if (roleId === 3) {
      const mecanico = await obtenerMecanicoDelUsuario(user.id_usuario)

      if (!mecanico) return NextResponse.json([])

      const ordenesAsignadas = await prisma.ordenTrabajo.findMany({
        where: {
          id_mecanico: mecanico.id_mecanico,
        },
        select: {
          id_orden: true,
          id_vehiculo: true,
        },
      })

      const idsOrdenes = ordenesAsignadas.map((o) => o.id_orden)
      const idsVehiculos = ordenesAsignadas.map((o) => o.id_vehiculo)

      if (idsOrdenes.length === 0 && idsVehiculos.length === 0) {
        return NextResponse.json([])
      }

      whereClause.OR = [
        {
          id_orden_origen: {
            in: idsOrdenes,
          },
        },
        {
          id_vehiculo: {
            in: idsVehiculos,
          },
        },
      ]
    }

    const alertas = await prisma.alertaMantenimiento.findMany({
      where: whereClause,
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
        servicio: true,
        orden_origen: {
          include: {
            estado_actual: true,
            mecanico: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
      orderBy: {
        fecha_generada: 'desc',
      },
    })

    return NextResponse.json(alertas)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'

    return NextResponse.json(
      { error: 'Error al obtener alertas', details: message },
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

    const user = session.user as AuthUser
    const roleId = Number(user.id_rol)

    if (roleId !== 1 && roleId !== 2 && roleId !== 3) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()

    const {
      id_vehiculo,
      id_servicio,
      id_orden_origen,
      kilometraje_referencia,
      kilometraje_objetivo,
      fecha_objetivo,
      mensaje,
      estado,
    } = body

    const idVehiculoNum = Number(id_vehiculo)
    const idServicioNum = Number(id_servicio)
    const idOrdenOrigenNum = id_orden_origen ? Number(id_orden_origen) : null

    if (!idVehiculoNum || !idServicioNum || !mensaje) {
      return NextResponse.json(
        { error: 'Vehículo, servicio y mensaje son requeridos' },
        { status: 400 }
      )
    }

    const vehiculo = await prisma.vehiculo.findUnique({
      where: {
        id_vehiculo: idVehiculoNum,
      },
    })

    if (!vehiculo) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 })
    }

    const servicio = await prisma.servicio.findUnique({
      where: {
        id_servicio: idServicioNum,
      },
    })

    if (!servicio) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }

    if (roleId === 3) {
      const mecanico = await obtenerMecanicoDelUsuario(user.id_usuario)

      if (!mecanico) {
        return NextResponse.json({ error: 'Mecánico no encontrado' }, { status: 403 })
      }

      if (idOrdenOrigenNum) {
        const ordenAsignada = await prisma.ordenTrabajo.findFirst({
          where: {
            id_orden: idOrdenOrigenNum,
            id_mecanico: mecanico.id_mecanico,
          },
          select: {
            id_orden: true,
            id_vehiculo: true,
          },
        })

        if (!ordenAsignada) {
          return NextResponse.json(
            { error: 'No puedes crear alertas para una orden que no está asignada a ti' },
            { status: 403 }
          )
        }

        if (Number(ordenAsignada.id_vehiculo) !== Number(idVehiculoNum)) {
          return NextResponse.json(
            { error: 'El vehículo no coincide con la orden seleccionada' },
            { status: 400 }
          )
        }
      } else {
        const ordenDelVehiculo = await prisma.ordenTrabajo.findFirst({
          where: {
            id_vehiculo: idVehiculoNum,
            id_mecanico: mecanico.id_mecanico,
          },
        })

        if (!ordenDelVehiculo) {
          return NextResponse.json(
            { error: 'No puedes crear alertas para un vehículo que no está asignado a ti' },
            { status: 403 }
          )
        }
      }
    }

    const alerta = await prisma.alertaMantenimiento.create({
      data: {
        id_vehiculo: idVehiculoNum,
        id_servicio: idServicioNum,
        id_orden_origen: idOrdenOrigenNum,
        kilometraje_referencia: kilometraje_referencia
          ? Number(kilometraje_referencia)
          : null,
        kilometraje_objetivo: kilometraje_objetivo
          ? Number(kilometraje_objetivo)
          : null,
        fecha_objetivo: fecha_objetivo ? new Date(fecha_objetivo) : null,
        mensaje,
        estado: estado || 'Pendiente',
      },
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
        servicio: true,
        orden_origen: {
          include: {
            estado_actual: true,
            mecanico: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(alerta, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'

    return NextResponse.json(
      { error: 'Error al crear alerta', details: message },
      { status: 500 }
    )
  }
}