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

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        vehiculos: true,
      },
    })

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error: unknown) {
    console.error('Error fetching client details:', error)
    return NextResponse.json({ error: 'Error al obtener el cliente' }, { status: 500 })
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
    const { nombre, telefono, email, direccion } = body

    if (!nombre || !telefono || !email || !direccion) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    // Check if another client has this email
    const existing = await prisma.cliente.findFirst({
      where: {
        email,
        id: { not: id },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Ya existe otro cliente con este correo electrónico' }, { status: 400 })
    }

    const updatedCliente = await prisma.cliente.update({
      where: { id },
      data: { nombre, telefono, email, direccion },
    })

    return NextResponse.json(updatedCliente)
  } catch (error: unknown) {
    console.error('Error updating client:', error)
    return NextResponse.json({ error: 'Error al actualizar el cliente' }, { status: 500 })
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

    await prisma.cliente.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Cliente eliminado correctamente' })
  } catch (error: unknown) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ error: 'Error al eliminar el cliente' }, { status: 500 })
  }
}
