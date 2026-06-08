import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    const clientes = await prisma.cliente.findMany({
      where: query
        ? {
            usuario: {
              OR: [
                { nombre: { contains: query, mode: 'insensitive' } },
                { correo: { contains: query, mode: 'insensitive' } },
                { telefono: { contains: query, mode: 'insensitive' } },
              ],
            }
          }
        : {},
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
  } catch (error: any) {
    console.error('API Error /api/clientes:', error)
    return NextResponse.json({
      error: 'Error al obtener los clientes',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, telefono, email, direccion, identidad } = body

    if (!nombre || !telefono || !email || !direccion) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    const existingUsuario = await prisma.usuario.findUnique({
      where: { correo: email },
    })

    if (existingUsuario) {
      return NextResponse.json({ error: 'Ya existe un usuario con este correo electrónico' }, { status: 400 })
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

      const cliente = await tx.cliente.create({
        data: {
          id_usuario: usuario.id_usuario,
          identidad,
          direccion,
        },
        include: {
          usuario: true
        }
      })

      return cliente
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('API Error /api/clientes POST:', error)
    return NextResponse.json({
      error: 'Error al crear el cliente',
      details: error.message
    }, { status: 500 })
  }
}
