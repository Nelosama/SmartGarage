import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vehiculoIdParam = searchParams.get('vehiculoId')
    const query = searchParams.get('q') || ''
    const estado = searchParams.get('estado') || ''

    const whereClause: Record<string, unknown> = {}

    if (vehiculoIdParam) {
      const vehiculoId = parseInt(vehiculoIdParam, 10)
      if (!isNaN(vehiculoId)) {
        whereClause.vehiculoId = vehiculoId
      }
    }

    if (estado) {
      whereClause.estado = estado
    }

    if (query) {
      whereClause.OR = [
        { servicio: { contains: query, mode: 'insensitive' } },
        { diagnostico: { contains: query, mode: 'insensitive' } },
        {
          vehiculo: {
            OR: [
              { placa: { contains: query, mode: 'insensitive' } },
              { marca: { contains: query, mode: 'insensitive' } },
              { modelo: { contains: query, mode: 'insensitive' } },
            ],
          },
        },
      ]
    }

    const ordenes = await prisma.orden.findMany({
      where: whereClause,
      include: {
        vehiculo: {
          include: {
            cliente: true,
          },
        },
        serviciosRealizados: true,
      },
      orderBy: { fecha: 'desc' },
    })

    return NextResponse.json(ordenes)
  } catch (error: unknown) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Error al obtener las órdenes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { servicio, diagnostico, estado, fecha, vehiculoId } = body

    if (!servicio || !diagnostico || !estado || !fecha || vehiculoId === undefined) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    const parsedVehiculoId = parseInt(vehiculoId, 10)

    if (isNaN(parsedVehiculoId)) {
      return NextResponse.json({ error: 'Vehículo ID inválido' }, { status: 400 })
    }

    if (!['Pendiente', 'En progreso', 'Completado'].includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido. Debe ser Pendiente, En progreso o Completado' }, { status: 400 })
    }

    const orden = await prisma.orden.create({
      data: {
        servicio,
        diagnostico,
        estado,
        fecha: new Date(fecha),
        vehiculoId: parsedVehiculoId,
      },
      include: {
        vehiculo: {
          include: {
            cliente: true,
          },
        },
      },
    })

    return NextResponse.json(orden, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Error al crear la orden' }, { status: 500 })
  }
}
