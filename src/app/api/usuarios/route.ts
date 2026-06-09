import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      include: { rol: true },
      orderBy: { nombre: 'asc' },
    })
    return NextResponse.json(usuarios)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener usuarios', details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id_rol, nombre, correo, password_hash, telefono, estado } = body

    if (!id_rol || !nombre || !correo || !password_hash) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    const usuario = await prisma.usuario.create({
      data: { id_rol, nombre, correo, password_hash, telefono, estado: estado || 'Activo' },
    })
    return NextResponse.json(usuario, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear usuario', details: error.message }, { status: 500 })
  }
}
