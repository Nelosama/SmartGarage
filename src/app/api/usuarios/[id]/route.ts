import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const u = await prisma.usuario.findUnique({ where: { id_usuario: parseInt(id) }, include: { rol: true } })
    return NextResponse.json(u)
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const body = await req.json()
    const { id_rol, nombre, correo, password, telefono, estado } = body
    if (password) {
      await prisma.$executeRaw`UPDATE usuarios SET id_rol=${id_rol}, nombre=${nombre}, correo=${correo}, password_hash=crypt(${password}, gen_salt('bf', 10)), telefono=${telefono}, estado=${estado} WHERE id_usuario=${parseInt(id)}`
    } else {
      await prisma.usuario.update({ where: { id_usuario: parseInt(id) }, data: { id_rol, nombre, correo, telefono, estado } })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const id_usuario = parseInt(id)

    if (id_usuario === 1) {
      return NextResponse.json({ error: 'No se puede eliminar al Administrador principal' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // 1. Eliminar historial de estados
      await tx.historialEstadoOrden.deleteMany({ where: { id_usuario } })

      // 2. Verificar si es cliente y eliminar dependencias
      const cliente = await tx.cliente.findUnique({ where: { id_usuario } })
      if (cliente) {
        // Ordenes (restriccion de FK en BD: Restrict en ordenes_trabajo -> cliente)
        // Pero el requerimiento dice "eliminar cliente (y sus vehículos y órdenes relacionadas)"

        // Primero eliminar registros hijos de ordenes
        const ordenes = await tx.ordenTrabajo.findMany({ where: { id_cliente: cliente.id_cliente } })
        const idsOrdenes = ordenes.map(o => o.id_orden)

        if (idsOrdenes.length > 0) {
          await tx.historialEstadoOrden.deleteMany({ where: { id_orden: { in: idsOrdenes } } })
          await tx.diagnostico.deleteMany({ where: { id_orden: { in: idsOrdenes } } })
          await tx.ordenServicio.deleteMany({ where: { id_orden: { in: idsOrdenes } } })
          await tx.ordenRepuesto.deleteMany({ where: { id_orden: { in: idsOrdenes } } })
          await tx.factura.deleteMany({ where: { id_orden: { in: idsOrdenes } } })
          await tx.alertaMantenimiento.deleteMany({ where: { id_orden_origen: { in: idsOrdenes } } })
          await tx.ordenTrabajo.deleteMany({ where: { id_cliente: cliente.id_cliente } })
        }

        // Vehiculos (tienen CASCADE en la BD segun schema.prisma, pero por si acaso)
        await tx.alertaMantenimiento.deleteMany({ where: { id_vehiculo: { in: (await tx.vehiculo.findMany({where: {id_cliente: cliente.id_cliente}})).map(v => v.id_vehiculo) } } })
        await tx.vehiculo.deleteMany({ where: { id_cliente: cliente.id_cliente } })

        await tx.cliente.delete({ where: { id_cliente: cliente.id_cliente } })
      }

      // 3. Verificar si es mecanico
      const mecanico = await tx.mecanico.findUnique({ where: { id_usuario } })
      if (mecanico) {
        // Las ordenes tienen SetNull en id_mecanico segun el schema, asi que no es estrictamente necesario borrar ordenes
        await tx.mecanico.delete({ where: { id_mecanico: mecanico.id_mecanico } })
      }

      // 4. Finalmente eliminar usuario
      await tx.usuario.delete({ where: { id_usuario } })
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Delete user error:', e)
    return NextResponse.json({ error: 'Error al eliminar el usuario: ' + e.message }, { status: 500 })
  }
}
