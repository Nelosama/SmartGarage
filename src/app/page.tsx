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

export default async function DashboardPage() {
  let stats = {
    clientes: 0,
    vehiculos: 0,
    pendientes: 0,
    enProgreso: 0,
    completadas: 0,
    recaudado: 0
  }

  let recentOrders: {
    id_orden: number;
    motivo_ingreso: string;
    fecha_ingreso: Date;
    vehiculo: {
      marca: string;
      modelo: string;
      placa: string;
      cliente: {
        usuario: {
          nombre: string;
        } | null;
      } | null;
    };
    estado_actual: {
      nombre_estado: string;
    };
  }[] = []

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
      prisma.ordenTrabajo.count({ where: { estado_actual: { nombre_estado: 'Pendiente' } } }),
      prisma.ordenTrabajo.count({ where: { estado_actual: { nombre_estado: 'En progreso' } } }),
      prisma.ordenTrabajo.count({ where: { estado_actual: { nombre_estado: 'Completado' } } }),
      prisma.ordenServicio.findMany({ select: { subtotal: true } })
    ])

    const totalRecaudado = servicios.reduce((acc, s) => acc + Number(s.subtotal), 0)

    recentOrders = await prisma.ordenTrabajo.findMany({
      take: 5,
      orderBy: { fecha_ingreso: 'desc' },
      include: {
        vehiculo: {
          include: {
            cliente: {
              include: {
                usuario: true
              }
            }
          }
        },
        estado_actual: true
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
    console.error('Database connection failed:', error)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
        <div className="p-4 rounded-full bg-red-50 dark:bg-red-950/20 text-red-600">
          <AlertTriangle className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Error de Conexión</h2>
        <p className="max-w-md text-slate-500 dark:text-slate-400">
          No se pudo establecer conexión con la base de datos de Supabase.
          Por favor, verifique su archivo <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.env</code>.
        </p>
        <p className="text-xs text-slate-400 font-mono">{errorMsg}</p>
      </div>
    )
  }

  const activeOrdersCount = stats.pendientes + stats.enProgreso
  const totalOrders = activeOrdersCount + stats.completadas
  const completionRate = totalOrders > 0 ? Math.round((stats.completadas / totalOrders) * 100) : 0

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 to-orange-700 p-8 text-white shadow-xl shadow-orange-500/10">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-2xl font-black md:text-3xl">Panel de Control de SmartGarage</h2>
          <p className="mt-2 text-sm text-orange-100 leading-relaxed md:text-base">
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
          <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400">
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
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
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
              className="text-xs font-semibold text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300 flex items-center gap-1"
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-semibold">
                  <th className="py-3.5 px-6">Cliente/Vehículo</th>
                  <th className="py-3.5 px-4">Motivo</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-6 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentOrders.map((orden) => (
                  <tr key={orden.id_orden} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{orden.vehiculo.cliente?.usuario?.nombre || 'Sin nombre'}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {orden.vehiculo.marca} {orden.vehiculo.modelo} • <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px] font-bold text-slate-600 dark:text-slate-400">{orden.vehiculo.placa}</span>
                      </p>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {orden.motivo_ingreso}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${orden.estado_actual.nombre_estado === 'Completado'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : orden.estado_actual.nombre_estado === 'En progreso'
                          ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${orden.estado_actual.nombre_estado === 'Completado' ? 'bg-emerald-500' : orden.estado_actual.nombre_estado === 'En progreso' ? 'bg-orange-500' : 'bg-amber-500'
                          }`} />
                        {orden.estado_actual.nombre_estado}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-xs text-slate-400 dark:text-slate-500">
                      {new Date(orden.fecha_ingreso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
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
                <span className="text-orange-600 dark:text-orange-400">{completionRate}%</span>
              </div>
              <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-orange-600 to-emerald-500 rounded-full transition-all duration-500"
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
                  <p className="font-bold text-lg text-orange-600 dark:text-orange-400 mt-0.5">{activeOrdersCount}</p>
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
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl border border-slate-100 hover:border-orange-500/30 hover:bg-orange-50/10 dark:border-slate-800 dark:hover:border-orange-400/20 dark:hover:bg-orange-950/10 text-center transition-all duration-200"
              >
                <div className="p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nuevo Cliente</span>
              </Link>
              <Link
                href="/vehiculos"
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl border border-slate-100 hover:border-slate-500/30 hover:bg-slate-50/10 dark:border-slate-800 dark:hover:border-slate-400/20 dark:hover:bg-slate-950/10 text-center transition-all duration-200"
              >
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
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
