import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ordenIdParam = searchParams.get('ordenId')
    const query = searchParams.get('q') || ''

    const whereClause: Record<string, unknown> = {}

    if (ordenIdParam) {
      const ordenId = parseInt(ordenIdParam, 10)
      if (!isNaN(ordenId)) {
        whereClause.ordenId = ordenId
      }
    }

    if (query) {
      whereClause.OR = [
        { descripcion: { contains: query, mode: 'insensitive' } },
        { repuesto: { contains: query, mode: 'insensitive' } },
      ]
    }

    const servicios = await prisma.servicioRealizado.findMany({
      where: whereClause,
      include: {
        orden: {
          include: {
            vehiculo: {
              include: {
                cliente: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(servicios)
  } catch (error: unknown) {
    console.error('Error fetching performed services:', error)
    return NextResponse.json({ error: 'Error al obtener los servicios realizados' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { descripcion, repuesto, costo, ordenId } = body

    if (!descripcion || repuesto === undefined || costo === undefined || ordenId === undefined) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    const parsedCosto = parseFloat(costo)
    const parsedOrdenId = parseInt(ordenId, 10)

    if (isNaN(parsedCosto) || isNaN(parsedOrdenId)) {
      return NextResponse.json({ error: 'Costo u Orden ID inválidos' }, { status: 400 })
    }

    const servicioRealizado = await prisma.servicioRealizado.create({
      data: {
        descripcion,
        repuesto,
        costo: parsedCosto,
        ordenId: parsedOrdenId,
      },
      include: {
        orden: true,
      },
    })

    return NextResponse.json(servicioRealizado, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating performed service:', error)
    return NextResponse.json({ error: 'Error al crear el servicio realizado' }, { status: 500 })
  }
}
