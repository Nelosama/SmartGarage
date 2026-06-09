import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const rol = await prisma.rol.findUnique({ where: { id_rol: id } })
    if (!rol) return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })
    return NextResponse.json(rol)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener rol', details: error.message }, { status: 500 })
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
    const { nombre_rol, descripcion } = body

    const rol = await prisma.rol.update({
      where: { id_rol: id },
      data: { nombre_rol, descripcion },
    })
    return NextResponse.json(rol)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar rol', details: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    await prisma.rol.delete({ where: { id_rol: id } })
    return NextResponse.json({ message: 'Rol eliminado' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar rol', details: error.message }, { status: 500 })
  }
}
