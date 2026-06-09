import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const roles = await prisma.rol.findMany({
      orderBy: { nombre_rol: 'asc' },
    })
    return NextResponse.json(roles)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener roles', details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre_rol, descripcion } = body
    if (!nombre_rol) return NextResponse.json({ error: 'Nombre de rol es requerido' }, { status: 400 })

    const rol = await prisma.rol.create({
      data: { nombre_rol, descripcion },
    })
    return NextResponse.json(rol, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear rol', details: error.message }, { status: 500 })
  }
}
