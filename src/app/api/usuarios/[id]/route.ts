import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: id },
      include: { rol: true }
    })
    if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    return NextResponse.json(usuario)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener usuario', details: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const body = await request.json()
    const { id_rol, nombre, correo, password_hash, telefono, estado } = body

    const usuario = await prisma.usuario.update({
      where: { id_usuario: id },
      data: { id_rol, nombre, correo, password_hash, telefono, estado },
    })
    return NextResponse.json(usuario)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar usuario', details: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    await prisma.usuario.delete({ where: { id_usuario: id } })
    return NextResponse.json({ message: 'Usuario eliminado' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar usuario', details: error.message }, { status: 500 })
  }
}
