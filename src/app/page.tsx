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

  let recentOrders: any[] = []

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
      prisma.ordenTrabajo.count({ where: { estado_actual: { nombre_estado: 'Recibido' } } }),
      prisma.ordenTrabajo.count({ where: { estado_actual: { nombre_estado: 'En reparación' } } }),
      prisma.ordenTrabajo.count({ where: { estado_actual: { nombre_estado: 'Listo para entrega' } } }),
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
        <div className="p-4 rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Error de Conexión</h2>
        <p className="max-w-md text-slate-500">
          No se pudo establecer conexión con la base de datos.
        </p>
      </div>
    )
  }

  const activeOrdersCount = stats.pendientes + stats.enProgreso
  const totalOrders = activeOrdersCount + stats.completadas
  const completionRate = totalOrders > 0 ? Math.round((stats.completadas / totalOrders) * 100) : 0

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 to-orange-700 p-8 text-white shadow-xl shadow-orange-500/10">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-2xl font-black md:text-3xl">Panel de Control de SmartGarage</h2>
          <p className="mt-2 text-sm text-orange-100 leading-relaxed md:text-base">
            Bienvenido al sistema. Administra de forma integral las órdenes de trabajo, clientes, vehículos y servicios facturados del taller mecánico en tiempo real.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Clientes</span>
            <h3 className="text-3xl font-extrabold tracking-tight">{stats.clientes}</h3>
          </div>
          <div className="p-3.5 rounded-xl bg-orange-50 text-orange-600">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Vehículos</span>
            <h3 className="text-3xl font-extrabold tracking-tight">{stats.vehiculos}</h3>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-100 text-slate-600">
            <Car className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">En Taller</span>
            <h3 className="text-3xl font-extrabold tracking-tight">{activeOrdersCount}</h3>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600">
            <Wrench className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Total Recaudado</span>
            <h3 className="text-3xl font-extrabold tracking-tight">
              L {stats.recaudado.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Órdenes de Trabajo Recientes</h3>
              <p className="text-xs text-slate-400">Últimos vehículos ingresados al taller</p>
            </div>
            <Link
              href="/ordenes"
              className="text-xs font-semibold text-orange-600 hover:text-orange-500 flex items-center gap-1"
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold">
                  <th className="py-3.5 px-6">Cliente/Vehículo</th>
                  <th className="py-3.5 px-4">Motivo</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-6 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((orden) => (
                  <tr key={orden.id_orden} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800">{orden.vehiculo.cliente?.usuario?.nombre || 'Sin nombre'}</p>
                      <p className="text-xs text-slate-400">
                        {orden.vehiculo.marca} {orden.vehiculo.modelo} • <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px] font-bold text-slate-600">{orden.vehiculo.placa}</span>
                      </p>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700">
                      {orden.motivo_ingreso}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700">
                        {orden.estado_actual.nombre_estado}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-xs text-slate-400">
                      {new Date(orden.fecha_ingreso).toLocaleDateString('es-HN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-800">Eficiencia</h3>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="text-slate-500">Tasa de Finalización</span>
                <span className="text-orange-600">{completionRate}%</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-600 transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
