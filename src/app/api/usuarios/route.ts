import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      include: { rol: true },
      orderBy: { nombre: 'asc' },
    })
    return NextResponse.json(usuarios)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener usuarios', details: error.message }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id_rol, nombre, correo, password, telefono, estado } = body
    if (!id_rol || !nombre || !correo || !password) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
    await prisma.$executeRaw`
      INSERT INTO usuarios (id_rol, nombre, correo, password_hash, telefono, estado, fecha_creacion)
      VALUES (${id_rol}, ${nombre}, ${correo}, crypt(${password}, gen_salt('bf', 10)), ${telefono}, ${estado || 'Activo'}, NOW())
    `
    const usuario = await prisma.usuario.findUnique({ where: { correo } })
    if (!usuario) throw new Error("Error")
    if (id_rol === 3) await prisma.mecanico.create({ data: { id_usuario: usuario.id_usuario } })
    if (id_rol === 4) await prisma.cliente.create({ data: { id_usuario: usuario.id_usuario } })
    return NextResponse.json(usuario, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error', details: error.message }, { status: 500 })
  }
}