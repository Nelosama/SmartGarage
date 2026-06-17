import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const user = session.user as { id_rol: number; id_usuario: string }
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    const whereClause: Prisma.ClienteWhereInput = {}
    if (user.id_rol === 4) {
      whereClause.id_usuario = parseInt(user.id_usuario)
    }
    if (query) {
      whereClause.OR = [
        { usuario: { nombre: { contains: query, mode: 'insensitive' } } },
        { usuario: { correo: { contains: query, mode: 'insensitive' } } },
        { usuario: { telefono: { contains: query, mode: 'insensitive' } } },
        { identidad: { contains: query, mode: 'insensitive' } },
      ]
    }
    /* OPTIMIZACIÓN: Implementación de paginación y selección de campos para evitar sobrecarga de datos (N+1 evitado por Prisma include/select) */
    const clientes = await prisma.cliente.findMany({
      where: whereClause,
      take: limit,
      skip: skip,
      select: {
        id_cliente: true,
        direccion: true,
        identidad: true,
        usuario: {
          select: {
            nombre: true,
            correo: true,
            telefono: true,
          }
        },
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
  } catch (error: unknown) {
    console.error('GET /api/clientes error:', error)
    return NextResponse.json({ error: 'Error al obtener los clientes' }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const user = session.user as { id_rol: number; id_usuario: string }
    if (user.id_rol !== 1 && user.id_rol !== 2) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }
    const body = await request.json()
    const { nombre, telefono, email, direccion, identidad, password } = body
    if (!nombre || !telefono || !email || !direccion || !password) {
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
      await tx.$executeRaw`
        INSERT INTO usuarios (id_rol, nombre, correo, password_hash, telefono, estado, fecha_creacion)
        VALUES (${rolCliente!.id_rol}, ${nombre}, ${email}, crypt(${password}, gen_salt('bf', 10)), ${telefono}, 'Activo', NOW())
      `
      const usuario = await tx.usuario.findUnique({
        where: { correo: email }
      })
      if (!usuario) {
        throw new Error('No se pudo crear el usuario asociado al cliente')
      }
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