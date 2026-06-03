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

    const vehiculo = await prisma.vehiculo.findUnique({
      where: { id },
      include: {
        cliente: true,
        ordenes: true,
      },
    })

    if (!vehiculo) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 })
    }

    return NextResponse.json(vehiculo)
  } catch (error: any) {
    console.error('Error fetching vehicle details:', error)
    return NextResponse.json({ error: 'Error al obtener el vehículo' }, { status: 500 })
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
    const { placa, marca, modelo, anio, clienteId } = body

    if (!placa || !marca || !modelo || anio === undefined || clienteId === undefined) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    const parsedAnio = parseInt(anio, 10)
    const parsedClienteId = parseInt(clienteId, 10)

    if (isNaN(parsedAnio) || isNaN(parsedClienteId)) {
      return NextResponse.json({ error: 'Año o Cliente ID inválidos' }, { status: 400 })
    }

    // Check if another vehicle has this plate
    const existing = await prisma.vehiculo.findFirst({
      where: {
        placa,
        id: { not: id },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Ya existe otro vehículo registrado con esta placa' }, { status: 400 })
    }

    const updatedVehiculo = await prisma.vehiculo.update({
      where: { id },
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

    return NextResponse.json(updatedVehiculo)
  } catch (error: any) {
    console.error('Error updating vehicle:', error)
    return NextResponse.json({ error: 'Error al actualizar el vehículo' }, { status: 500 })
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

    await prisma.vehiculo.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Vehículo eliminado correctamente' })
  } catch (error: any) {
    console.error('Error deleting vehicle:', error)
    return NextResponse.json({ error: 'Error al eliminar el vehículo' }, { status: 500 })
  }
}
