import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const ordenRepuestos = await prisma.ordenRepuesto.findMany({
      include: { orden: true, repuesto: true },
    })
    return NextResponse.json(ordenRepuestos)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener repuestos de orden', details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id_orden, id_repuesto, cantidad, precio_unitario } = body
    if (!id_orden || !id_repuesto || !cantidad || !precio_unitario) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    const subtotal = Number(cantidad) * Number(precio_unitario)

    const ordenRepuesto = await prisma.ordenRepuesto.create({
      data: { id_orden, id_repuesto, cantidad, precio_unitario, subtotal },
    })
    return NextResponse.json(ordenRepuesto, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al asignar repuesto a orden', details: error.message }, { status: 500 })
  }
}
