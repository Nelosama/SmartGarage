import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Prisma } from '@prisma/client'
interface AuthUser {
  id_rol: number
  id_usuario: string
}
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const factura = await prisma.resumenFactura.findUnique({
      where: { id_factura: id },
    })
    if (!factura) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    return NextResponse.json(factura)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: 'Error al obtener factura', details: message }, { status: 500 })
  }
}
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const user = session.user as AuthUser
    if (user.id_rol !== 1 && user.id_rol !== 2) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const body = await request.json()
    const { numero_factura, subtotal_servicios, subtotal_repuestos, impuesto, descuento, estado_pago, metodo_pago } = body
    const sServ = Number(subtotal_servicios) || 0
    const sRep = Number(subtotal_repuestos) || 0
    const imp = Number(impuesto) || 0
    const desc = Number(descuento) || 0
    const calculatedTotal = sServ + sRep + imp - desc
    const factura = await prisma.factura.update({
      where: { id_factura: id },
      data: {
        numero_factura,
        subtotal_servicios: subtotal_servicios !== undefined ? new Prisma.Decimal(sServ) : undefined,
        subtotal_repuestos: subtotal_repuestos !== undefined ? new Prisma.Decimal(sRep) : undefined,
        impuesto: impuesto !== undefined ? new Prisma.Decimal(imp) : undefined,
        descuento: descuento !== undefined ? new Prisma.Decimal(desc) : undefined,
        total: new Prisma.Decimal(calculatedTotal),
        estado_pago,
        metodo_pago
      },
    })
    return NextResponse.json(factura)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: 'Error al actualizar factura', details: message }, { status: 500 })
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const user = session.user as AuthUser
    if (user.id_rol !== 1) {
      return NextResponse.json({ error: 'Acceso denegado. Solo administradores pueden eliminar facturas.' }, { status: 403 })
    }
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const factura = await prisma.factura.findUnique({
      where: { id_factura: id }
    })
    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }
    if (factura.estado_pago === 'Pagado') {
      return NextResponse.json({ error: 'No se puede eliminar una factura con estado Pagado.' }, { status: 400 })
    }
    await prisma.factura.delete({ where: { id_factura: id } })
    return NextResponse.json({ message: 'Factura eliminada' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: 'Error al eliminar factura', details: message }, { status: 500 })
  }
}