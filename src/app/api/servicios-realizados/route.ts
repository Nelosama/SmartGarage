import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ordenIdParam = searchParams.get('ordenId')
    const query = searchParams.get('q') || ''

    const whereClause: any = {}

    if (ordenIdParam) {
      const id_orden = parseInt(ordenIdParam, 10)
      if (!isNaN(id_orden)) {
        whereClause.id_orden = id_orden
      }
    }

    if (query) {
      whereClause.OR = [
        { observaciones: { contains: query, mode: 'insensitive' } },
        {
          servicio: {
            nombre_servicio: { contains: query, mode: 'insensitive' }
          }
        }
      ]
    }

    const servicios = await prisma.ordenServicio.findMany({
      where: whereClause,
      include: {
        servicio: true,
        orden: {
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
          },
        },
      },
      orderBy: { id_orden_servicio: 'desc' },
    })

    return NextResponse.json(servicios)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener los servicios realizados', details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id_servicio, id_orden, cantidad, precio_unitario, observaciones } = body

    if (!id_servicio || !id_orden || cantidad === undefined || precio_unitario === undefined) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    const servicioRealizado = await prisma.ordenServicio.create({
      data: {
        id_servicio,
        id_orden,
        cantidad: Number(cantidad) || 1,
        precio_unitario: Number(precio_unitario),
        observaciones
      },
      include: {
        servicio: true,
        orden: true,
      },
    })

    return NextResponse.json(servicioRealizado, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear el servicio realizado', details: error.message }, { status: 500 })
  }
}
