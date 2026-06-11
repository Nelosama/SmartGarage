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
    const whereClause: Prisma.AlertaMantenimientoWhereInput = {}

    if (user.id_rol === 4) { // Cliente
      const cliente = await prisma.cliente.findUnique({ where: { id_usuario: parseInt(user.id_usuario) } })
      if (cliente) {
        whereClause.vehiculo = { id_cliente: cliente.id_cliente }
      } else {
        return NextResponse.json([])
      }
    }

    const alertas = await prisma.alertaMantenimiento.findMany({
      where: whereClause,
      include: { vehiculo: true, servicio: true },
    })
    return NextResponse.json(alertas)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener alertas', details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id_vehiculo, id_servicio, id_orden_origen, kilometraje_referencia, kilometraje_objetivo, fecha_objetivo, mensaje, estado } = body
    if (!id_vehiculo || !id_servicio || !mensaje) return NextResponse.json({ error: 'Vehiculo, servicio y mensaje son requeridos' }, { status: 400 })

    const alerta = await prisma.alertaMantenimiento.create({
      data: {
        id_vehiculo,
        id_servicio,
        id_orden_origen,
        kilometraje_referencia,
        kilometraje_objetivo,
        fecha_objetivo: fecha_objetivo ? new Date(fecha_objetivo) : null,
        mensaje,
        estado: estado || 'Pendiente'
      },
    })
    return NextResponse.json(alerta, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear alerta', details: error.message }, { status: 500 })
  }
}
