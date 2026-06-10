import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vehiculoIdParam = searchParams.get('vehiculoId')
    const query = searchParams.get('q') || ''
    const estadoIdParam = searchParams.get('estadoId')

    const whereClause: any = {}

    if (vehiculoIdParam) {
      const id_vehiculo = parseInt(vehiculoIdParam, 10)
      if (!isNaN(id_vehiculo)) {
        whereClause.id_vehiculo = id_vehiculo
      }
    }

    if (estadoIdParam) {
      const id_estado_actual = parseInt(estadoIdParam, 10)
      if (!isNaN(id_estado_actual)) {
        whereClause.id_estado_actual = id_estado_actual
      }
    }

    if (query) {
      whereClause.OR = [
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
              nombre: { contains: query, mode: 'insensitive' }
            }
          }
        }
      ]
    }

    const ordenes = await prisma.ordenTrabajo.findMany({
      where: whereClause,
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
      },
      orderBy: { fecha_ingreso: 'desc' },
    })

    return NextResponse.json(ordenes)
  } catch (error: any) {
    console.error('API Error /api/ordenes:', error)
    return NextResponse.json({
      error: 'Error al obtener las órdenes',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      id_cliente,
      id_vehiculo,
      id_mecanico,
      id_estado_actual,
      kilometraje_ingreso,
      motivo_ingreso,
      prioridad,
      observaciones
    } = body

    if (!id_cliente || !id_vehiculo || !id_estado_actual || kilometraje_ingreso === undefined || !motivo_ingreso) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const orden = await prisma.ordenTrabajo.create({
      data: {
        id_cliente,
        id_vehiculo,
        id_mecanico,
        id_estado_actual,
        kilometraje_ingreso,
        motivo_ingreso,
        prioridad: prioridad || 'Media',
        observaciones,
      },
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

    return NextResponse.json(orden, { status: 201 })
  } catch (error: any) {
    console.error('API Error /api/ordenes POST:', error)
    return NextResponse.json({
      error: 'Error al crear la orden',
      details: error.message
    }, { status: 500 })
  }
}
