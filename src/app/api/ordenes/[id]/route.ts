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

    const orden = await prisma.orden.findUnique({
      where: { id },
      include: {
        vehiculo: {
          include: {
            cliente: true,
          },
        },
        serviciosRealizados: true,
      },
    })

    if (!orden) {
      return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })
    }

    return NextResponse.json(orden)
  } catch (error: unknown) {
    console.error('Error fetching order details:', error)
    return NextResponse.json({ error: 'Error al obtener la orden' }, { status: 500 })
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

    const updatedOrden = await prisma.orden.update({
      where: { id },
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

    return NextResponse.json(updatedOrden)
  } catch (error: unknown) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Error al actualizar la orden' }, { status: 500 })
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

    await prisma.orden.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Orden de trabajo eliminada correctamente' })
  } catch (error: unknown) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: 'Error al eliminar la orden' }, { status: 500 })
  }
}
