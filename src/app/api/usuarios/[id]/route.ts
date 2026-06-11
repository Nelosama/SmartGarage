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
    await prisma.usuario.delete({ where: { id_usuario: parseInt(id) } })
    return NextResponse.json({ ok: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
