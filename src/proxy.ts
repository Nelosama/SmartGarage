import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    const id_rol = token?.id_rol as number

    if (id_rol === 1) return NextResponse.next()
    if (id_rol === 2) {
      const allowed = ['/clientes', '/vehiculos', '/ordenes', '/servicios-realizados', '/api/']
      if (pathname === '/' || allowed.some(path => pathname.startsWith(path))) return NextResponse.next()
    }
    if (id_rol === 3) {
      const allowed = ['/ordenes', '/diagnosticos', '/servicios-realizados', '/api/']
      if (pathname === '/' || allowed.some(path => pathname.startsWith(path))) return NextResponse.next()
    }
    if (id_rol === 4) {
      const allowed = ['/mi-dashboard', '/vehiculos', '/ordenes', '/api/']
      if (pathname === '/' || allowed.some(path => pathname.startsWith(path))) return NextResponse.next()
    }

    if (pathname === '/') return NextResponse.next()
    return NextResponse.redirect(new URL("/", req.url))
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
    pages: { signIn: '/login' }
  }
)

export const config = {
  matcher: ['/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)'],
}
