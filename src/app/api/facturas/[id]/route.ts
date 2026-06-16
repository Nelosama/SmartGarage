import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface UserSession {
  id_rol: number
  id_usuario: string
  nombre: string
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

    // Usar la vista para consistencia
    const factura = await prisma.resumenFactura.findUnique({
      where: { id_factura: id }
    })

    if (!factura) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })

    // RBAC check
    const user = session.user as UserSession
    if (Number(user.id_rol) === 4) {
      const cliente = await prisma.cliente.findUnique({ where: { id_usuario: Number(user.id_usuario) } })
      const orden = await prisma.ordenTrabajo.findUnique({ where: { id_orden: factura.id_orden as number } })
      if (!cliente || !orden || orden.id_cliente !== cliente.id_cliente) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    return NextResponse.json(factura)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: 'Error al obtener factura', details: msg }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as UserSession
    const id_rol = Number(user.id_rol)
    if (id_rol !== 1 && id_rol !== 2) {
      return NextResponse.json({ error: 'No autorizado para editar facturas' }, { status: 403 })
    }

    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const body = await request.json()
    const { numero_factura, subtotal_servicios, subtotal_repuestos, impuesto, descuento, total, estado_pago, metodo_pago } = body

    // Validar que el numero_factura sea único si cambió
    if (numero_factura) {
      const facturaExistente = await prisma.factura.findFirst({
        where: {
          numero_factura,
          id_factura: { not: id }
        }
      })
      if (facturaExistente) {
        return NextResponse.json({ error: 'El número de factura ya existe' }, { status: 400 })
      }
    }

    const factura = await prisma.factura.update({
      where: { id_factura: id },
      data: {
        numero_factura,
        subtotal_servicios: subtotal_servicios !== undefined ? Number(subtotal_servicios) : undefined,
        subtotal_repuestos: subtotal_repuestos !== undefined ? Number(subtotal_repuestos) : undefined,
        impuesto: impuesto !== undefined ? Number(impuesto) : undefined,
        descuento: descuento !== undefined ? Number(descuento) : undefined,
        total: total !== undefined ? Number(total) : undefined,
        estado_pago,
        metodo_pago
      },
    })
    return NextResponse.json(factura)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: 'Error al actualizar factura', details: msg }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as UserSession
    if (Number(user.id_rol) !== 1) {
      return NextResponse.json({ error: 'Solo el administrador puede eliminar facturas' }, { status: 403 })
    }

    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    const factura = await prisma.factura.findUnique({ where: { id_factura: id } })
    if (!factura) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })

    if (factura.estado_pago === 'Pagado') {
      return NextResponse.json({ error: 'No se puede eliminar una factura ya pagada' }, { status: 400 })
    }

    await prisma.factura.delete({ where: { id_factura: id } })
    return NextResponse.json({ message: 'Factura eliminada' })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: 'Error al eliminar factura', details: msg }, { status: 500 })
  }
}
