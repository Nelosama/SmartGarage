import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = session.user as any
    const id_usuario = parseInt(user.id_usuario)

    const body = await request.json()
    const { passwordActual, passwordNueva } = body

    if (!passwordActual || !passwordNueva) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const valid: { id_usuario: number }[] = await prisma.$queryRaw`
      SELECT id_usuario FROM usuarios
      WHERE id_usuario = ${id_usuario}
      AND password_hash = crypt(${passwordActual}, password_hash)
    `

    if (valid.length === 0) {
      return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 })
    }

    await prisma.$executeRaw`
      UPDATE usuarios
      SET password_hash = crypt(${passwordNueva}, gen_salt('bf', 10))
      WHERE id_usuario = ${id_usuario}
    `

    return NextResponse.json({ message: 'Contraseña actualizada con éxito' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('API Error /api/usuarios/cambiar-password:', error)
    return NextResponse.json({ error: 'Error al cambiar la contraseña', details: message }, { status: 500 })
  }
}
