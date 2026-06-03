import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { 
  Users, 
  Car, 
  Wrench, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  ClipboardList
} from 'lucide-react'

// Force dynamic rendering to always query fresh database stats
export const dynamic = 'force-dynamic'

interface RecentOrder {
  id: number
  servicio: string
  estado: string
  fecha: Date | string
  vehiculo: {
    placa: string
    marca: string
    modelo: string
    cliente: {
      nombre: string
    }
  }
}

const getDemoOrders = (): RecentOrder[] => [
  {
    id: 1,
    servicio: 'Alineación y Balanceo',
    estado: 'En progreso',
    fecha: new Date(),
    vehiculo: {
      placa: 'MEC-1234',
      marca: 'Toyota',
      modelo: 'Hilux',
      cliente: { nombre: 'Juan Pérez' }
    }
  },
  {
    id: 2,
    servicio: 'Cambio de Aceite y Filtros',
    estado: 'Pendiente',
    fecha: new Date(Date.now() - 3600000 * 2),
    vehiculo: {
      placa: 'ABC-7890',
      marca: 'Honda',
      modelo: 'Civic',
      cliente: { nombre: 'María Rodríguez' }
    }
  },
  {
    id: 3,
    servicio: 'Frenos y Rectificación de Discos',
    estado: 'Completado',
    fecha: new Date(Date.now() - 3600000 * 5),
    vehiculo: {
      placa: 'XYZ-5544',
      marca: 'Ford',
      modelo: 'Ranger',
      cliente: { nombre: 'Carlos Mendoza' }
    }
  },
  {
    id: 4,
    servicio: 'Reparación de Suspensión Delantera',
    estado: 'En progreso',
    fecha: new Date(Date.now() - 3600000 * 24),
    vehiculo: {
      placa: 'PQR-9988',
      marca: 'Hyundai',
      modelo: 'Tucson',
      cliente: { nombre: 'Ana Gómez' }
    }
  },
  {
    id: 5,
    servicio: 'Diagnóstico Eléctrico de Motor',
    estado: 'Completado',
    fecha: new Date(Date.now() - 3600000 * 48),
    vehiculo: {
      placa: 'BMW-320I',
      marca: 'BMW',
      modelo: 'Serie 3',
      cliente: { nombre: 'Luis Valenzuela' }
    }
  }
]

export default async function DashboardPage() {
  let stats = {
    clientes: 0,
    vehiculos: 0,
    pendientes: 0,
    enProgreso: 0,
    completadas: 0,
    recaudado: 0
  }
  
  let recentOrders: RecentOrder[] = []
  let isDemoData = false

  try {
    const [
      totalClientes,
      totalVehiculos,
      pendientes,
      progreso,
      completadas,
      servicios
    ] = await Promise.all([
      prisma.cliente.count(),
      prisma.vehiculo.count(),
      prisma.orden.count({ where: { estado: 'Pendiente' } }),
      prisma.orden.count({ where: { estado: 'En progreso' } }),
      prisma.orden.count({ where: { estado: 'Completado' } }),
      prisma.servicioRealizado.findMany({ select: { costo: true } })
    ])

    const totalRecaudado = servicios.reduce((acc, s) => acc + s.costo, 0)

    recentOrders = await prisma.orden.findMany({
      take: 5,
      orderBy: { fecha: 'desc' },
      include: {
        vehiculo: {
          include: {
            cliente: true
          }
        }
      }
    })

    stats = {
      clientes: totalClientes,
      vehiculos: totalVehiculos,
      pendientes,
      enProgreso: progreso,
      completadas,
      recaudado: totalRecaudado
    }
  } catch (error) {
    console.warn('Could not connect to database, using premium fallback demo data:', error)
    isDemoData = true
    
    // Premium fallback demo data so the app looks beautiful before database is fully running
    stats = {
      clientes: 124,
      vehiculos: 148,
      pendientes: 5,
      enProgreso: 8,
      completadas: 312,
      recaudado: 14250.75
    }

    recentOrders = getDemoOrders()
  }

  const activeOrdersCount = stats.pendientes + stats.enProgreso
  const totalOrders = activeOrdersCount + stats.completadas
  const completionRate = totalOrders > 0 ? Math.round((stats.completadas / totalOrders) * 100) : 0

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Alert Warning if demo data */}
      {isDemoData && (
        <div className="flex items-start gap-4 p-4 rounded-2xl border border-amber-200/50 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
          <div>
            <h4 className="font-bold text-sm">Modo de Demostración</h4>
            <p className="text-xs mt-1 leading-relaxed opacity-90">
              No se pudo conectar a la base de datos PostgreSQL local en <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">localhost:5432</code>. Asegúrate de iniciar tu servidor de base de datos local y ejecutar las migraciones con <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">npx prisma db push</code>. Mostrando datos de prueba interactivos.
            </p>
          </div>
        </div>
      )}

      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-2xl font-black md:text-3xl">Panel de Control de SmartGarage</h2>
          <p className="mt-2 text-sm text-blue-100 leading-relaxed md:text-base">
            Bienvenido al sistema. Administra de forma integral las órdenes de trabajo, clientes, vehículos y servicios facturados del taller mecánico en tiempo real.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial-gradient from-white/10 to-transparent pointer-events-none opacity-50" />
      </div>

      {/* Grid Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase">Clientes</span>
            <h3 className="text-3xl font-extrabold tracking-tight">{stats.clientes}</h3>
            <p className="text-[10px] text-emerald-500 font-medium">Activos en el sistema</p>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase">Vehículos</span>
            <h3 className="text-3xl font-extrabold tracking-tight">{stats.vehiculos}</h3>
            <p className="text-[10px] text-emerald-500 font-medium">Flota registrada</p>
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
            <Car className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase">En Taller</span>
            <h3 className="text-3xl font-extrabold tracking-tight">{activeOrdersCount}</h3>
            <div className="flex gap-2 text-[10px] font-semibold">
              <span className="text-amber-500">{stats.pendientes} Pendientes</span>
              <span className="text-blue-500">{stats.enProgreso} En proceso</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
            <Wrench className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase">Total Recaudado</span>
            <h3 className="text-3xl font-extrabold tracking-tight">
              ${stats.recaudado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-emerald-500 font-medium">Servicios completados</p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Órdenes de Trabajo Recientes</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Últimos vehículos ingresados al taller</p>
            </div>
            <Link 
              href="/ordenes" 
              className="text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-semibold">
                  <th className="py-3.5 px-6">Cliente/Vehículo</th>
                  <th className="py-3.5 px-4">Servicio</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-6 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentOrders.map((orden) => (
                  <tr key={orden.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{orden.vehiculo.cliente.nombre}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {orden.vehiculo.marca} {orden.vehiculo.modelo} • <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px] font-bold text-slate-600 dark:text-slate-400">{orden.vehiculo.placa}</span>
                      </p>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {orden.servicio}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        orden.estado === 'Completado'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : orden.estado === 'En progreso'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          orden.estado === 'Completado' ? 'bg-emerald-500' : orden.estado === 'En progreso' ? 'bg-blue-500' : 'bg-amber-500'
                        }`} />
                        {orden.estado}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-xs text-slate-400 dark:text-slate-500">
                      {new Date(orden.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions and Stats overview */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Progress bar card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Eficiencia en Entregas</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Porcentaje de órdenes completadas</p>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="text-slate-500 dark:text-slate-400">Tasa de Finalización</span>
                <span className="text-blue-600 dark:text-blue-400">{completionRate}%</span>
              </div>
              <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                  <p className="text-slate-400 dark:text-slate-500 font-medium">Totales</p>
                  <p className="font-bold text-lg mt-0.5">{totalOrders}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                  <p className="text-slate-400 dark:text-slate-500 font-medium">Activas</p>
                  <p className="font-bold text-lg text-blue-600 dark:text-blue-400 mt-0.5">{activeOrdersCount}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                  <p className="text-slate-400 dark:text-slate-500 font-medium">Listas</p>
                  <p className="font-bold text-lg text-emerald-500 mt-0.5">{stats.completadas}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Accesos Rápidos</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Crea registros rápidos en el sistema</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <Link 
                href="/clientes" 
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl border border-slate-100 hover:border-blue-500/30 hover:bg-blue-50/10 dark:border-slate-800 dark:hover:border-blue-400/20 dark:hover:bg-blue-950/10 text-center transition-all duration-200"
              >
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nuevo Cliente</span>
              </Link>
              <Link 
                href="/vehiculos" 
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl border border-slate-100 hover:border-indigo-500/30 hover:bg-indigo-50/10 dark:border-slate-800 dark:hover:border-indigo-400/20 dark:hover:bg-indigo-950/10 text-center transition-all duration-200"
              >
                <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <Car className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nuevo Vehículo</span>
              </Link>
              <Link 
                href="/ordenes" 
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl border border-slate-100 hover:border-amber-500/30 hover:bg-amber-50/10 dark:border-slate-800 dark:hover:border-amber-400/20 dark:hover:bg-amber-950/10 text-center transition-all duration-200"
              >
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Wrench className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nueva Orden</span>
              </Link>
              <Link 
                href="/servicios-realizados" 
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl border border-slate-100 hover:border-emerald-500/30 hover:bg-emerald-50/10 dark:border-slate-800 dark:hover:border-emerald-400/20 dark:hover:bg-emerald-950/10 text-center transition-all duration-200"
              >
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Registrar Servicio</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
