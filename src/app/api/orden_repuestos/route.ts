import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
async function recalcularFactura(tx: any, idOrden: number) {
  const serviciosOrden = await tx.ordenServicio.findMany({
    where: { id_orden: idOrden },
  })
  const repuestosOrden = await tx.ordenRepuesto.findMany({
    where: { id_orden: idOrden },
  })
  const subtotalServicios = serviciosOrden.reduce(
    (sum: number, s: any) => sum + Number(s.subtotal || 0),
    0
  )
  const subtotalRepuestos = repuestosOrden.reduce(
    (sum: number, r: any) => sum + Number(r.subtotal || 0),
    0
  )
  const impuesto = Number(((subtotalServicios + subtotalRepuestos) * 0.15).toFixed(2))
  const total = Number((subtotalServicios + subtotalRepuestos + impuesto).toFixed(2))
  await tx.factura.upsert({
    where: { id_orden: idOrden },
    update: {
      subtotal_servicios: subtotalServicios,
      subtotal_repuestos: subtotalRepuestos,
      impuesto,
      total,
      estado_pago: 'Pendiente',
    },
    create: {
      id_orden: idOrden,
      numero_factura: `FAC-${idOrden}-${Date.now()}`,
      subtotal_servicios: subtotalServicios,
      subtotal_repuestos: subtotalRepuestos,
      impuesto,
      descuento: 0,
      total,
      estado_pago: 'Pendiente',
    },
  })
}
async function validarPermisoOrden(user: any, idOrden: number) {
  if (user.id_rol !== 3) return null
  const mecanico = await prisma.mecanico.findUnique({
    where: { id_usuario: Number(user.id_usuario) },
  })
  if (!mecanico) {
    return NextResponse.json({ error: 'Mecánico no encontrado' }, { status: 403 })
  }
  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id_orden: idOrden },
    select: {
      id_orden: true,
      id_mecanico: true,
    },
  })
  if (!orden) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }
  if (!orden.id_mecanico) {
    return NextResponse.json(
      { error: 'Primero debes tomar esta orden antes de agregar repuestos' },
      { status: 403 }
    )
  }
  if (orden.id_mecanico !== mecanico.id_mecanico) {
    return NextResponse.json(
      { error: 'No puedes agregar repuestos a una orden asignada a otro mecánico' },
      { status: 403 }
    )
  }
  return null
}
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const user = session.user as any
    const whereClause: any = {}
    if (user.id_rol === 3) {
      const mecanico = await prisma.mecanico.findUnique({
        where: { id_usuario: Number(user.id_usuario) },
      })
      if (!mecanico) return NextResponse.json([])
      whereClause.orden = {
        id_mecanico: mecanico.id_mecanico,
      }
    }
    if (user.id_rol === 4) {
  const cliente = await prisma.cliente.findUnique({
    where: { id_usuario: Number(user.id_usuario) },
  })
  if (!cliente) return NextResponse.json([])
  whereClause.orden = {
    vehiculo: {
      id_cliente: cliente.id_cliente,
    },
  }
}
    const ordenRepuestos = await prisma.ordenRepuesto.findMany({
      where: whereClause,
      include: {
        orden: true,
        repuesto: true,
      },
      orderBy: {
        id_orden_repuesto: 'desc',
      },
    })
    return NextResponse.json(ordenRepuestos)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al obtener repuestos de orden', details: error.message },
      { status: 500 }
    )
  }
}
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const user = session.user as any
    if (user.id_rol !== 1 && user.id_rol !== 2 && user.id_rol !== 3) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }
    const body = await request.json()
    const { id_orden, id_repuesto, cantidad, precio_unitario } = body
    if (!id_orden || !id_repuesto || cantidad === undefined || precio_unitario === undefined) {
      return NextResponse.json(
        { error: 'Campos requeridos faltantes' },
        { status: 400 }
      )
    }
    const idOrdenNum = Number(id_orden)
    const idRepuestoNum = Number(id_repuesto)
    const cantidadNum = Number(cantidad)
    const precioUnitarioNum = Number(precio_unitario)
    if (cantidadNum <= 0 || precioUnitarioNum < 0) {
      return NextResponse.json(
        { error: 'Cantidad o precio inválido' },
        { status: 400 }
      )
    }
    const permisoError = await validarPermisoOrden(user, idOrdenNum)
    if (permisoError) return permisoError
    const result = await prisma.$transaction(async (tx) => {
      const repuesto = await tx.repuesto.findUnique({
        where: { id_repuesto: idRepuestoNum },
      })
      if (!repuesto) {
        throw new Error('Repuesto no encontrado')
      }
      if (repuesto.stock < cantidadNum) {
        throw new Error('Stock insuficiente para este repuesto')
      }
      const ordenRepuesto = await tx.ordenRepuesto.create({
        data: {
          id_orden: idOrdenNum,
          id_repuesto: idRepuestoNum,
          cantidad: cantidadNum,
          precio_unitario: precioUnitarioNum,
        },
        include: {
          orden: true,
          repuesto: true,
        },
      })
      await tx.repuesto.update({
        where: { id_repuesto: idRepuestoNum },
        data: {
          stock: {
            decrement: cantidadNum,
          },
        },
      })
      await recalcularFactura(tx, idOrdenNum)
      return ordenRepuesto
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al asignar repuesto a orden', details: error.message },
      { status: 500 }
    )
  }
}