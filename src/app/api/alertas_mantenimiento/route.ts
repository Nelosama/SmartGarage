import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Prisma } from '@prisma/client'
interface AuthUser {
  id_rol: number
  id_usuario: string
}
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const user = session.user as AuthUser
    const roleId = Number(user.id_rol)
    const whereClause: Prisma.AlertaMantenimientoWhereInput = {}
    if (roleId === 4) {
      const cliente = await prisma.cliente.findUnique({
        where: { id_usuario: parseInt(user.id_usuario) },
      })
      if (cliente) {
        whereClause.vehiculo = { id_cliente: cliente.id_cliente }
      } else {
        return NextResponse.json([])
      }
    }
    const alertas = await prisma.alertaMantenimiento.findMany({
      where: whereClause,
      include: {
        vehiculo: true,
        servicio: true,
      },
      orderBy: {
        fecha_generada: 'desc',
      },
    })
    return NextResponse.json(alertas)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { error: 'Error al obtener alertas', details: message },
      { status: 500 }
    )
  }
}
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const user = session.user as AuthUser
    const roleId = Number(user.id_rol)
    if (roleId !== 1 && roleId !== 2) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }
    const body = await request.json()
    const {
      id_vehiculo,
      id_servicio,
      id_orden_origen,
      kilometraje_referencia,
      kilometraje_objetivo,
      fecha_objetivo,
      mensaje,
      estado,
    } = body
    if (!id_vehiculo || !id_servicio || !mensaje) {
      return NextResponse.json(
        { error: 'Vehiculo, servicio y mensaje son requeridos' },
        { status: 400 }
      )
    }
    const alerta = await prisma.alertaMantenimiento.create({
      data: {
        id_vehiculo: Number(id_vehiculo),
        id_servicio: Number(id_servicio),
        id_orden_origen: id_orden_origen ? Number(id_orden_origen) : null,
        kilometraje_referencia: kilometraje_referencia ? Number(kilometraje_referencia) : null,
        kilometraje_objetivo: kilometraje_objetivo ? Number(kilometraje_objetivo) : null,
        fecha_objetivo: fecha_objetivo ? new Date(fecha_objetivo) : null,
        mensaje,
        estado: estado || 'Pendiente',
      },
    })
    return NextResponse.json(alerta, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { error: 'Error al crear alerta', details: message },
      { status: 500 }
    )
  }
}