import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const alerta = await prisma.alertaMantenimiento.findUnique({
      where: { id_alerta: id },
      include: { vehiculo: true, servicio: true }
    })
    if (!alerta) return NextResponse.json({ error: 'Alerta no encontrada' }, { status: 404 })
    return NextResponse.json(alerta)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener alerta', details: error.message }, { status: 500 })
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
    const { id_servicio, kilometraje_referencia, kilometraje_objetivo, fecha_objetivo, mensaje, estado } = body
    const alerta = await prisma.alertaMantenimiento.update({
      where: { id_alerta: id },
      data: {
        id_servicio,
        kilometraje_referencia,
        kilometraje_objetivo,
        fecha_objetivo: fecha_objetivo ? new Date(fecha_objetivo) : null,
        mensaje,
        estado
      },
    })
    return NextResponse.json(alerta)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar alerta', details: error.message }, { status: 500 })
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    await prisma.alertaMantenimiento.delete({ where: { id_alerta: id } })
    return NextResponse.json({ message: 'Alerta eliminada' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar alerta', details: error.message }, { status: 500 })
  }
}