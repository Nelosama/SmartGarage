import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteIdParam = searchParams.get('clienteId')
    const query = searchParams.get('q') || ''

    const whereClause: any = {}

    if (clienteIdParam) {
      const clienteId = parseInt(clienteIdParam, 10)
      if (!isNaN(clienteId)) {
        whereClause.clienteId = clienteId
      }
    }

    if (query) {
      whereClause.OR = [
        { placa: { contains: query, mode: 'insensitive' } },
        { marca: { contains: query, mode: 'insensitive' } },
        { modelo: { contains: query, mode: 'insensitive' } },
      ]
    }

    const vehiculos = await prisma.vehiculo.findMany({
      where: whereClause,
      include: {
        cliente: true,
      },
      orderBy: { placa: 'asc' },
    })

    return NextResponse.json(vehiculos)
  } catch (error: any) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json({ error: 'Error al obtener los vehículos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { placa, marca, modelo, anio, clienteId } = body

    if (!placa || !marca || !modelo || anio === undefined || clienteId === undefined) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    const parsedAnio = parseInt(anio, 10)
    const parsedClienteId = parseInt(clienteId, 10)

    if (isNaN(parsedAnio) || isNaN(parsedClienteId)) {
      return NextResponse.json({ error: 'Año o Cliente ID inválidos' }, { status: 400 })
    }

    // Check if plate already exists
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
        clienteId: parsedClienteId,
      },
      include: {
        cliente: true,
      },
    })

    return NextResponse.json(vehiculo, { status: 201 })
  } catch (error: any) {
    console.error('Error creating vehicle:', error)
    return NextResponse.json({ error: 'Error al crear el vehículo' }, { status: 500 })
  }
}
