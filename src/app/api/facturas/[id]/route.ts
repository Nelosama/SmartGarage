import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const facturaInclude = {
  orden: {
    include: {
      estado_actual: true,
      vehiculo: {
        include: {
          cliente: {
            include: {
              usuario: true,
            },
          },
        },
      },
      mecanico: {
        include: {
          usuario: true,
        },
      },
      orden_servicios: {
        include: {
          servicio: true,
        },
      },
      orden_repuestos: {
        include: {
          repuesto: true,
        },
      },
    },
  },
}

function normalizarEstadoPago(estado: string) {
  const value = estado.trim().toLowerCase()

  if (value === 'pagada' || value === 'pagado') return 'Pagado'
  if (value === 'pendiente') return 'Pendiente'
  if (value === 'anulado' || value === 'anulada') return 'Anulado'

  return null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = session.user as any
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    if (user.id_rol !== 1 && user.id_rol !== 2 && user.id_rol !== 4) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const factura = await prisma.factura.findUnique({
      where: {
        id_factura: id,
      },
      include: facturaInclude,
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    if (user.id_rol === 4) {
      const cliente = await prisma.cliente.findUnique({
        where: {
          id_usuario: Number(user.id_usuario),
        },
      })

      if (!cliente || factura.orden.vehiculo.id_cliente !== cliente.id_cliente) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
      }
    }

    return NextResponse.json(factura)
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Error al obtener factura',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = session.user as any

    if (user.id_rol !== 1 && user.id_rol !== 2) {
      return NextResponse.json(
        { error: 'Solo admin o recepción pueden actualizar facturas' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const facturaActual = await prisma.factura.findUnique({
      where: {
        id_factura: id,
      },
    })

    if (!facturaActual) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    const body = await request.json()

    const {
      numero_factura,
      subtotal_servicios,
      subtotal_repuestos,
      impuesto,
      descuento,
      total,
      estado_pago,
      metodo_pago,
    } = body

    const data: any = {}

    if (numero_factura !== undefined) {
      data.numero_factura = numero_factura
    }

    if (subtotal_servicios !== undefined) {
      data.subtotal_servicios = Number(subtotal_servicios)
    }

    if (subtotal_repuestos !== undefined) {
      data.subtotal_repuestos = Number(subtotal_repuestos)
    }

    if (impuesto !== undefined) {
      data.impuesto = Number(impuesto)
    }

    if (descuento !== undefined) {
      data.descuento = Number(descuento)
    }

    if (total !== undefined) {
      data.total = Number(total)
    }

    if (estado_pago !== undefined) {
      const estadoNormalizado = normalizarEstadoPago(String(estado_pago))

      if (!estadoNormalizado) {
        return NextResponse.json(
          { error: 'Estado de pago inválido. Usa Pendiente, Pagado o Anulado.' },
          { status: 400 }
        )
      }

      data.estado_pago = estadoNormalizado
    }

    if (metodo_pago !== undefined) {
      data.metodo_pago = metodo_pago || null
    }

    const factura = await prisma.factura.update({
      where: {
        id_factura: id,
      },
      data,
      include: facturaInclude,
    })

    return NextResponse.json(factura)
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Error al actualizar factura',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = session.user as any

    if (user.id_rol !== 1) {
      return NextResponse.json(
        { error: 'Solo admin puede eliminar facturas' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const factura = await prisma.factura.findUnique({
      where: {
        id_factura: id,
      },
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    await prisma.factura.delete({
      where: {
        id_factura: id,
      },
    })

    return NextResponse.json({ message: 'Factura eliminada correctamente' })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Error al eliminar factura',
        details: error.message,
      },
      { status: 500 }
    )
  }
}