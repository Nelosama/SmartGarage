import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const servicio = await prisma.servicio.findUnique({ where: { id_servicio: id } })
    if (!servicio) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    return NextResponse.json(servicio)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener servicio', details: error.message }, { status: 500 })
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
    const { nombre_servicio, descripcion, precio_base, duracion_estimada_min, intervalo_km, intervalo_meses, estado } = body
    const servicio = await prisma.servicio.update({
      where: { id_servicio: id },
      data: { nombre_servicio, descripcion, precio_base, duracion_estimada_min, intervalo_km, intervalo_meses, estado },
    })
    return NextResponse.json(servicio)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar servicio', details: error.message }, { status: 500 })
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    await prisma.servicio.delete({ where: { id_servicio: id } })
    return NextResponse.json({ message: 'Servicio eliminado' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar servicio', details: error.message }, { status: 500 })
  }
}