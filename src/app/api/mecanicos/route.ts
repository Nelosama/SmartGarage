import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const mecanicos = await prisma.mecanico.findMany({
      include: { usuario: true },
    })
    return NextResponse.json(mecanicos)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener mecanicos', details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id_usuario, especialidad, estado } = body
    if (!id_usuario) return NextResponse.json({ error: 'Usuario es requerido' }, { status: 400 })

    const mecanico = await prisma.mecanico.create({
      data: { id_usuario, especialidad, estado: estado || 'Disponible' },
    })
    return NextResponse.json(mecanico, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear mecanico', details: error.message }, { status: 500 })
  }
}
