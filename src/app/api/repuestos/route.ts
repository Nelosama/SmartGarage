import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export async function GET() {
  try {
    const repuestos = await prisma.repuesto.findMany({
      orderBy: { nombre_repuesto: 'asc' },
    })
    return NextResponse.json(repuestos)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener repuestos', details: error.message }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre_repuesto, marca, descripcion, stock, precio_unitario, stock_minimo, estado } = body
    if (!nombre_repuesto) return NextResponse.json({ error: 'Nombre de repuesto es requerido' }, { status: 400 })
    const repuesto = await prisma.repuesto.create({
      data: { nombre_repuesto, marca, descripcion, stock: stock || 0, precio_unitario: precio_unitario || 0, stock_minimo: stock_minimo || 0, estado: estado || 'Activo' },
    })
    return NextResponse.json(repuesto, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear repuesto', details: error.message }, { status: 500 })
  }
}