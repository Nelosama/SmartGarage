import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { NextAuthOptions } from 'next-auth'
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        correo: { label: "Correo", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.correo || !credentials?.password) return null
        try {
          const users = await prisma.$queryRaw<any[]>`
            SELECT u.id_usuario, u.nombre, u.correo, u.id_rol, r.nombre_rol
            FROM usuarios u
            JOIN roles r ON u.id_rol = r.id_rol
            WHERE u.correo = ${credentials.correo}
            AND u.password_hash = crypt(${credentials.password}, u.password_hash)
            LIMIT 1
          `
          const user = users[0]
          if (user) {
            return {
              id: user.id_usuario.toString(),
              name: user.nombre,
              email: user.correo,
              id_rol: user.id_rol,
              nombre_rol: user.nombre_rol
            }
          }
          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id_usuario = (user as any).id
        token.id_rol = (user as any).id_rol
        token.nombre_rol = (user as any).nombre_rol
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id_usuario = token.id_usuario;
        (session.user as any).id_rol = token.id_rol;
        (session.user as any).nombre_rol = token.nombre_rol;
      }
      return session
    }
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: undefined,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}