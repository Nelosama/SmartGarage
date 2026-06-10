import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    const whereClause: Prisma.ClienteWhereInput = {}

    if (query) {
      whereClause.OR = [
        { usuario: { nombre: { contains: query, mode: 'insensitive' } } },
        { usuario: { correo: { contains: query, mode: 'insensitive' } } },
        { usuario: { telefono: { contains: query, mode: 'insensitive' } } },
        { identidad: { contains: query, mode: 'insensitive' } },
      ]
    }

    const clientes = await prisma.cliente.findMany({
      where: whereClause,
      include: {
        usuario: true,
        _count: {
          select: { vehiculos: true }
        }
      },
      orderBy: {
        usuario: {
          nombre: 'asc'
        }
      },
    })

    const flattenedClientes = clientes.map(c => ({
      id: c.id_cliente,
      nombre: c.usuario.nombre,
      email: c.usuario.correo,
      telefono: c.usuario.telefono,
      direccion: c.direccion,
      identidad: c.identidad,
      _count: c._count
    }))

    return NextResponse.json(flattenedClientes)
  } catch (error) {
    console.error('GET /api/clientes error:', error)
    return NextResponse.json({ error: 'Error al obtener los clientes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, telefono, email, direccion, identidad } = body

    if (!nombre || !telefono || !email || !direccion) {
      return NextResponse.json({ error: 'Todos los campos obligatorios son requeridos' }, { status: 400 })
    }

    let rolCliente = await prisma.rol.findFirst({
      where: { nombre_rol: 'Cliente' }
    })

    if (!rolCliente) {
      rolCliente = await prisma.rol.create({
        data: { nombre_rol: 'Cliente', descripcion: 'Rol para clientes del taller' }
      })
    }

    const result = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nombre,
          correo: email,
          telefono,
          password_hash: 'temporalsync',
          id_rol: rolCliente!.id_rol,
          estado: 'Activo'
        }
      })

      return await tx.cliente.create({
        data: {
          id_usuario: usuario.id_usuario,
          identidad,
          direccion,
        },
        include: {
          usuario: true
        }
      })
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('POST /api/clientes error:', error)
    return NextResponse.json({ error: 'Error al crear el cliente', details: message }, { status: 500 })
  }
}
