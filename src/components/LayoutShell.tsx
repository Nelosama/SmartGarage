'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  Wrench, 
  ClipboardList,
  Sun, 
  Moon, 
  Menu, 
  X,
  Gauge
} from 'lucide-react'

interface LayoutShellProps {
  children: React.ReactNode
}

export default function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    // Check local storage or system preference
    const initTheme = () => {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (savedTheme) {
        setTheme(savedTheme)
        document.documentElement.classList.toggle('dark', savedTheme === 'dark')
      } else {
        // Default to dark mode for rich aesthetics
        setTheme('dark')
        document.documentElement.classList.add('dark')
      }
    }

    // Using a microtask to avoid synchronous state update in effect
    void Promise.resolve().then(initTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Vehículos', href: '/vehiculos', icon: Car },
    { name: 'Órdenes de Trabajo', href: '/ordenes', icon: Wrench },
    { name: 'Servicios Realizados', href: '/servicios-realizados', icon: ClipboardList },
  ]

  const getPageTitle = () => {
    const item = menuItems.find(m => m.href === pathname || (m.href !== '/' && pathname.startsWith(m.href)))
    return item ? item.name : 'SmartGarage'
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Gauge className="h-6 w-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                SmartGarage
              </span>
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase">
                Taller Mecánico
              </span>
            </div>
          </Link>
          <button 
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href === '/' 
              ? pathname === '/' 
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800/60'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-blue-600 dark:bg-blue-400" />
                )}
                <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                }`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer Sidebar info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-slate-800 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-sm">
              SG
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Administrador</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Sesión Local</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Cambiar tema"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 md:text-xl">
              {getPageTitle()}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Servidor DB: Conectado
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
