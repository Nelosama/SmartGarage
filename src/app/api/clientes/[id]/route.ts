import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
      where: { id_cliente: id },
      include: {
        usuario: true,
        vehiculos: true,
      },
    })
    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }
    return NextResponse.json({
      id: cliente.id_cliente,
      nombre: cliente.usuario.nombre,
      email: cliente.usuario.correo,
      telefono: cliente.usuario.telefono,
      direccion: cliente.direccion,
      identidad: cliente.identidad,
      vehiculos: cliente.vehiculos
    })
  } catch (error: any) {
    console.error('API Error /api/clientes/[id]:', error)
    return NextResponse.json({ error: 'Error al obtener el cliente' }, { status: 500 })
  }
}
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const user = session.user as any
    if (user.id_rol !== 1 && user.id_rol !== 2) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const body = await request.json()
    const { nombre, telefono, email, direccion, identidad } = body
    if (!nombre || !telefono || !email || !direccion) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }
    const existingUsuario = await prisma.usuario.findFirst({
      where: {
        correo: email,
        cliente: {
          id_cliente: { not: id }
        }
      },
    })
    if (existingUsuario) {
      return NextResponse.json({ error: 'Ya existe otro cliente con este correo electrónico' }, { status: 400 })
    }
    const updatedCliente = await prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.findUnique({
        where: { id_cliente: id },
        include: { usuario: true }
      })
      if (!cliente) throw new Error('Cliente no encontrado')
      await tx.usuario.update({
        where: { id_usuario: cliente.id_usuario },
        data: {
          nombre,
          correo: email,
          telefono
        }
      })
      return await tx.cliente.update({
        where: { id_cliente: id },
        data: {
          direccion,
          identidad
        },
        include: { usuario: true }
      })
    })
    return NextResponse.json(updatedCliente)
  } catch (error: any) {
    console.error('API Error /api/clientes/[id] PUT:', error)
    return NextResponse.json({ error: 'Error al actualizar el cliente', details: error.message }, { status: 500 })
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const user = session.user as any
    if (user.id_rol !== 1 && user.id_rol !== 2) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const cliente = await prisma.cliente.findUnique({
      where: { id_cliente: id }
    })
    if (cliente) {
      await prisma.usuario.delete({
        where: { id_usuario: cliente.id_usuario },
      })
    }
    return NextResponse.json({ message: 'Cliente eliminado correctamente' })
  } catch (error: any) {
    console.error('API Error /api/clientes/[id] DELETE:', error)
    return NextResponse.json({ error: 'Error al eliminar el cliente' }, { status: 500 })
  }
}