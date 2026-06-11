'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  Wrench, 
  ClipboardList,
  Menu, 
  X,
  Activity,
  Package,
  Briefcase,
  LogOut,
  FileText,
  History,
  AlertTriangle,
  UserCog
} from 'lucide-react'

interface LayoutShellProps {
  children: React.ReactNode
}

export default function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useSession()
  const user = session?.user as any

  const allMenuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: [1, 2, 3] },
    { name: 'Mi Dashboard', href: '/mi-dashboard', icon: LayoutDashboard, roles: [4] },
    { name: 'Clientes', href: '/clientes', icon: Users, roles: [1, 2] },
    { name: 'Vehículos', href: '/vehiculos', icon: Car, roles: [1, 2, 4] },
    { name: 'Órdenes de Trabajo', href: '/ordenes', icon: Wrench, roles: [1, 2, 3, 4] },
    { name: 'Diagnósticos', href: '/diagnosticos', icon: Activity, roles: [1, 3] },
    { name: 'Servicios Realizados', href: '/servicios-realizados', icon: ClipboardList, roles: [1, 2, 3] },
    { name: 'Facturas', href: '/facturas', icon: FileText, roles: [1, 2, 4] },
    { name: 'Historial Estados', href: '/historial', icon: History, roles: [1, 2, 3] },
    { name: 'Alertas Mantenimiento', href: '/alertas', icon: AlertTriangle, roles: [1, 2, 4] },
    { name: 'Catálogo Servicios', href: '/servicios', icon: Activity, roles: [1] },
    { name: 'Inventario Repuestos', href: '/repuestos', icon: Package, roles: [1] },
    { name: 'Equipo Mecánico', href: '/mecanicos', icon: Briefcase, roles: [1] },
    { name: 'Usuarios', href: '/usuarios', icon: UserCog, roles: [1] },
  ]

  const menuItems = useMemo(() => {
    if (!user) return []
    return allMenuItems.filter(item => item.roles.includes(user.id_rol))
  }, [user])

  const getPageTitle = () => {
    const item = allMenuItems.find(m => m.href === pathname || (m.href !== '/' && pathname.startsWith(m.href)))
    return item ? item.name : 'SmartGarage'
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex transition-colors duration-300">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200">
          <Link href={user?.id_rol === 4 ? '/mi-dashboard' : '/'} className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
            <div className="p-2.5 rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                SmartGarage
              </span>
              <span className="block text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                Taller Mecánico
              </span>
            </div>
          </Link>
          <button 
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
            title="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href === '/' 
              ? pathname === '/' 
              : (pathname === item.href || pathname.startsWith(item.href + '/'))

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100/80'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-orange-600" />
                )}
                <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'text-orange-600' : 'text-slate-400'
                }`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 text-sm uppercase">
              {user?.name?.slice(0, 2) || 'SG'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{user?.name || 'Cargando...'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.nombre_rol || 'Usuario'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 md:hidden"
              aria-label="Abrir menú"
              title="Abrir menú"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 md:text-xl">
              {getPageTitle()}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
