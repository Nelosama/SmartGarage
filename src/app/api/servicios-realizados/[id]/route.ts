import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const servicio = await prisma.ordenServicio.findUnique({
      where: { id_orden_servicio: id },
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
    })

    if (!servicio) {
      return NextResponse.json({ error: 'Servicio realizado no encontrado' }, { status: 404 })
    }

    return NextResponse.json(servicio)
  } catch (error: any) {
    console.error('API Error /api/servicios-realizados/[id]:', error)
    return NextResponse.json({ error: 'Error al obtener el servicio realizado' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    const { id_servicio, id_orden, cantidad, precio_unitario, observaciones } = body

    const data: any = {}
    if (id_servicio) data.id_servicio = id_servicio
    if (id_orden) data.id_orden = id_orden
    if (cantidad !== undefined) data.cantidad = cantidad
    if (precio_unitario !== undefined) data.precio_unitario = precio_unitario
    if (observaciones !== undefined) data.observaciones = observaciones

    const updatedServicio = await prisma.ordenServicio.update({
      where: { id_orden_servicio: id },
      data,
      include: {
        servicio: true,
        orden: true,
      },
    })

    return NextResponse.json(updatedServicio)
  } catch (error: any) {
    console.error('API Error /api/servicios-realizados/[id] PUT:', error)
    return NextResponse.json({ error: 'Error al actualizar el servicio realizado' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    await prisma.ordenServicio.delete({
      where: { id_orden_servicio: id },
    })

    return NextResponse.json({ message: 'Servicio realizado eliminado correctamente' })
  } catch (error: any) {
    console.error('API Error /api/servicios-realizados/[id] DELETE:', error)
    return NextResponse.json({ error: 'Error al eliminar el servicio realizado' }, { status: 500 })
  }
}
