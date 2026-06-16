import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as { id_rol: number; id_usuario: string }
    const { searchParams } = new URL(request.url)

    const vehiculoIdParam = searchParams.get('vehiculoId')
    const query = searchParams.get('q') || ''
    const estadoIdParam = searchParams.get('estadoId')

    const andConditions: Prisma.OrdenTrabajoWhereInput[] = []

    if (user.id_rol === 3) {
      const mecanico = await prisma.mecanico.findUnique({
        where: { id_usuario: parseInt(user.id_usuario) },
      })

      if (mecanico) {
        andConditions.push({
          OR: [
            { id_mecanico: mecanico.id_mecanico },
            { id_mecanico: null },
          ],
        })
      } else {
        return NextResponse.json([])
      }
    }

    if (user.id_rol === 4) {
      const cliente = await prisma.cliente.findUnique({
        where: { id_usuario: parseInt(user.id_usuario) },
      })

      if (cliente) {
        andConditions.push({ id_cliente: cliente.id_cliente })
      } else {
        return NextResponse.json([])
      }
    }

    if (vehiculoIdParam) {
      const id_vehiculo = parseInt(vehiculoIdParam, 10)
      if (!isNaN(id_vehiculo)) {
        andConditions.push({ id_vehiculo })
      }
    }

    if (estadoIdParam) {
      const id_estado_actual = parseInt(estadoIdParam, 10)
      if (!isNaN(id_estado_actual)) {
        andConditions.push({ id_estado_actual })
      }
    }

    if (query) {
      andConditions.push({
        OR: [
          { motivo_ingreso: { contains: query, mode: 'insensitive' } },
          {
            vehiculo: {
              OR: [
                { placa: { contains: query, mode: 'insensitive' } },
                { marca: { contains: query, mode: 'insensitive' } },
                { modelo: { contains: query, mode: 'insensitive' } },
              ],
            },
          },
          {
            cliente: {
              usuario: {
                nombre: { contains: query, mode: 'insensitive' },
              },
            },
          },
        ],
      })
    }

    const whereClause: Prisma.OrdenTrabajoWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {}

    const ordenes = await prisma.ordenTrabajo.findMany({
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
        estado_actual: true,
        mecanico: {
          include: {
            usuario: true,
          },
        },
      },
      orderBy: { fecha_ingreso: 'desc' },
    })

    return NextResponse.json(ordenes)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('API Error /api/ordenes:', error)

    return NextResponse.json(
      {
        error: 'Error al obtener las órdenes',
        details: message,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as { id_rol: number; id_usuario: string }

    if (user.id_rol !== 1 && user.id_rol !== 2) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()

    const {
      id_cliente,
      id_vehiculo,
      id_mecanico,
      id_estado_actual,
      kilometraje_ingreso,
      motivo_ingreso,
      prioridad,
      observaciones,
      fecha_ingreso,
      fecha_estimada_entrega,
    } = body

    if (
      !id_cliente ||
      !id_vehiculo ||
      !id_estado_actual ||
      kilometraje_ingreso === undefined ||
      !motivo_ingreso
    ) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const orden = await prisma.$transaction(async (tx) => {
      const nuevaOrden = await tx.ordenTrabajo.create({
        data: {
          id_cliente: Number(id_cliente),
          id_vehiculo: Number(id_vehiculo),
          id_mecanico: id_mecanico ? Number(id_mecanico) : null,
          id_estado_actual: Number(id_estado_actual),
          kilometraje_ingreso: Number(kilometraje_ingreso),
          motivo_ingreso,
          prioridad: prioridad || 'Media',
          observaciones: observaciones || null,
          fecha_ingreso: fecha_ingreso ? new Date(fecha_ingreso) : undefined,
          fecha_estimada_entrega: fecha_estimada_entrega
            ? new Date(fecha_estimada_entrega)
            : null,
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
          estado_actual: true,
          mecanico: {
            include: {
              usuario: true,
            },
          },
        },
      })

      await tx.historialEstadoOrden.create({
        data: {
          id_orden: nuevaOrden.id_orden,
          id_estado: Number(id_estado_actual),
          id_usuario: user.id_usuario ? Number(user.id_usuario) : null,
          comentario: `Orden creada con estado: ${nuevaOrden.estado_actual.nombre_estado}`,
        },
      })

      return nuevaOrden
    })

    return NextResponse.json(orden, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('API Error /api/ordenes POST:', error)

    return NextResponse.json(
      {
        error: 'Error al crear la orden',
        details: message,
      },
      { status: 500 }
    )
  }
}