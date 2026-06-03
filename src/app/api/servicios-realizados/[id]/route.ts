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

    const servicio = await prisma.servicioRealizado.findUnique({
      where: { id },
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
    })

    if (!servicio) {
      return NextResponse.json({ error: 'Servicio realizado no encontrado' }, { status: 404 })
    }

    return NextResponse.json(servicio)
  } catch (error: any) {
    console.error('Error fetching service details:', error)
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
    const { descripcion, repuesto, costo, ordenId } = body

    if (!descripcion || repuesto === undefined || costo === undefined || ordenId === undefined) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    const parsedCosto = parseFloat(costo)
    const parsedOrdenId = parseInt(ordenId, 10)

    if (isNaN(parsedCosto) || isNaN(parsedOrdenId)) {
      return NextResponse.json({ error: 'Costo u Orden ID inválidos' }, { status: 400 })
    }

    const updatedServicio = await prisma.servicioRealizado.update({
      where: { id },
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

    return NextResponse.json(updatedServicio)
  } catch (error: any) {
    console.error('Error updating service:', error)
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

    await prisma.servicioRealizado.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Servicio realizado eliminado correctamente' })
  } catch (error: any) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ error: 'Error al eliminar el servicio realizado' }, { status: 500 })
  }
}
