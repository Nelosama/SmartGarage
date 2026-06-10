import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteIdParam = searchParams.get('clienteId')
    const query = searchParams.get('q') || ''

    const whereClause: Prisma.VehiculoWhereInput = {}

    if (clienteIdParam) {
      const id_cliente = parseInt(clienteIdParam, 10)
      if (!isNaN(id_cliente)) {
        whereClause.id_cliente = id_cliente
      }
    }

    if (query) {
      whereClause.OR = [
        { placa: { contains: query, mode: 'insensitive' } },
        { marca: { contains: query, mode: 'insensitive' } },
        { modelo: { contains: query, mode: 'insensitive' } },
        {
          cliente: {
            usuario: {
              nombre: { contains: query, mode: 'insensitive' }
            }
          }
        }
      ]
    }

    const vehiculos = await prisma.vehiculo.findMany({
      where: whereClause,
      include: {
        cliente: {
          include: {
            usuario: true
          }
        },
      },
      orderBy: { placa: 'asc' },
    })

    return NextResponse.json(vehiculos)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('API Error /api/vehiculos:', error)
    return NextResponse.json({
      error: 'Error al obtener los vehículos',
      details: message
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { placa, marca, modelo, anio, clienteId, color, vin, tipo_combustible, kilometraje_actual } = body

    if (!placa || !marca || !modelo || anio === undefined || clienteId === undefined) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    const parsedAnio = parseInt(anio, 10)
    const parsedClienteId = parseInt(clienteId, 10)

    if (isNaN(parsedAnio) || isNaN(parsedClienteId)) {
      return NextResponse.json({ error: 'Año o Cliente ID inválidos' }, { status: 400 })
    }

    const existing = await prisma.vehiculo.findUnique({
      where: { placa },
    })

    if (existing) {
      return NextResponse.json({ error: 'Ya existe un vehículo registrado con esta placa' }, { status: 400 })
    }

    const vehiculo = await prisma.vehiculo.create({
      data: {
        placa,
        marca,
        modelo,
        anio: parsedAnio,
        id_cliente: parsedClienteId,
        color,
        vin,
        tipo_combustible,
        kilometraje_actual: kilometraje_actual || 0
      },
      include: {
        cliente: {
          include: {
            usuario: true
          }
        },
      },
    })

    return NextResponse.json(vehiculo, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('API Error /api/vehiculos POST:', error)
    return NextResponse.json({
      error: 'Error al crear el vehículo',
      details: message
    }, { status: 500 })
  }
}
