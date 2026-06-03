import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    const clientes = await prisma.cliente.findMany({
      where: query
        ? {
            OR: [
              { nombre: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { telefono: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {},
      orderBy: { nombre: 'asc' },
    })

    return NextResponse.json(clientes)
  } catch (error: unknown) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Error al obtener los clientes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, telefono, email, direccion } = body

    if (!nombre || !telefono || !email || !direccion) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    // Check if client with this email already exists
    const existing = await prisma.cliente.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json({ error: 'Ya existe un cliente con este correo electrónico' }, { status: 400 })
    }

    const cliente = await prisma.cliente.create({
      data: { nombre, telefono, email, direccion },
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating client:', error)
    return NextResponse.json({ error: 'Error al crear el cliente' }, { status: 500 })
  }
}
