import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Prisma } from '@prisma/client'
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const user = session.user as any
    const whereClause: Prisma.HistorialEstadoOrdenWhereInput = {}
    if (user.id_rol === 3) {
      const mecanico = await prisma.mecanico.findUnique({ where: { id_usuario: parseInt(user.id_usuario) } })
      if (mecanico) {
        whereClause.orden = { id_mecanico: mecanico.id_mecanico }
      } else {
        return NextResponse.json([])
      }
    } else if (user.id_rol === 4) {
      const cliente = await prisma.cliente.findUnique({ where: { id_usuario: parseInt(user.id_usuario) } })
      if (cliente) {
        whereClause.orden = { id_cliente: cliente.id_cliente }
      } else {
        return NextResponse.json([])
      }
    }
    const historial = await prisma.historialEstadoOrden.findMany({
      where: whereClause,
      include: { orden: true, estado: true, usuario: true },
      orderBy: { fecha_hora: 'desc' },
    })
    return NextResponse.json(historial)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener historial', details: error.message }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id_orden, id_estado, id_usuario, comentario } = body
    if (!id_orden || !id_estado) return NextResponse.json({ error: 'ID Orden y ID Estado son requeridos' }, { status: 400 })
    const item = await prisma.historialEstadoOrden.create({
      data: { id_orden, id_estado, id_usuario, comentario },
    })
    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear historial', details: error.message }, { status: 500 })
  }
}