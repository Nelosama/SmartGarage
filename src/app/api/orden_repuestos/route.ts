import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const ordenRepuestos = await prisma.ordenRepuesto.findMany({
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
    const body = await request.json()
    const { id_orden, id_repuesto, cantidad, precio_unitario } = body

    if (!id_orden || !id_repuesto || !cantidad || !precio_unitario) {
      return NextResponse.json(
        { error: 'Campos requeridos faltantes' },
        { status: 400 }
      )
    }

    const cantidadNum = Number(cantidad)
    const idRepuestoNum = Number(id_repuesto)

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
          id_orden: Number(id_orden),
          id_repuesto: idRepuestoNum,
          cantidad: cantidadNum,
          precio_unitario: Number(precio_unitario),
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