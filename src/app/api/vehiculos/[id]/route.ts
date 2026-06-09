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
      where: { id_vehiculo: id },
      include: {
        cliente: {
          include: {
            usuario: true
          }
        },
        ordenes: true,
      },
    })

    if (!vehiculo) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 })
    }

    return NextResponse.json(vehiculo)
  } catch (error: any) {
    console.error('API Error /api/vehiculos/[id]:', error)
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
    const { placa, marca, modelo, anio, clienteId, color, vin, tipo_combustible, kilometraje_actual } = body

    if (!placa || !marca || !modelo || anio === undefined || clienteId === undefined) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    const parsedAnio = parseInt(anio, 10)
    const parsedClienteId = parseInt(clienteId, 10)

    if (isNaN(parsedAnio) || isNaN(parsedClienteId)) {
      return NextResponse.json({ error: 'Año o Cliente ID inválidos' }, { status: 400 })
    }

    const existing = await prisma.vehiculo.findFirst({
      where: {
        placa,
        id_vehiculo: { not: id },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Ya existe otro vehículo registrado con esta placa' }, { status: 400 })
    }

    const updatedVehiculo = await prisma.vehiculo.update({
      where: { id_vehiculo: id },
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

    return NextResponse.json(updatedVehiculo)
  } catch (error: any) {
    console.error('API Error /api/vehiculos/[id] PUT:', error)
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
      where: { id_vehiculo: id },
    })

    return NextResponse.json({ message: 'Vehículo eliminado correctamente' })
  } catch (error: any) {
    console.error('API Error /api/vehiculos/[id] DELETE:', error)
    return NextResponse.json({ error: 'Error al eliminar el vehículo' }, { status: 500 })
  }
}
