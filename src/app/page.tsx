import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  Users,
  Car,
  Wrench,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = session.user as any
  const id_rol = Number(user.id_rol)

  // Redirect Clientes to their specific dashboard
  if (id_rol === 4) {
    redirect('/mi-dashboard')
  }

  // Dashboard for Admin (1) and Reception (2)
  if (id_rol === 1 || id_rol === 2) {
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
        prisma.ordenTrabajo.count({ where: { estado_actual: { nombre_estado: { in: ['Listo para entrega', 'Entregado'] } } } }),
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
    } catch (e) {
      console.error(e)
    }

    const activeOrdersCount = stats.pendientes + stats.enProgreso

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="bg-orange-600 rounded-3xl p-8 text-white shadow-xl shadow-orange-500/20">
          <h2 className="text-2xl font-black">Panel de Control General</h2>
          <p className="text-orange-100 mt-2">Bienvenido, {user.nombre}. Resumen operativo del taller.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Clientes" value={stats.clientes} icon={<Users />} color="orange" />
          <StatCard title="Vehículos" value={stats.vehiculos} icon={<Car />} color="slate" />
          <StatCard title="En Taller" value={activeOrdersCount} icon={<Wrench />} color="amber" />
          {id_rol === 1 && (
            <StatCard title="Total Recaudado" value={`L ${stats.recaudado.toLocaleString()}`} icon={<TrendingUp />} color="emerald" />
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Órdenes Recientes</h3>
            <Link href="/ordenes" className="text-xs font-bold text-orange-600 hover:underline">Ver todas</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold">
                <tr>
                  <th className="px-6 py-3">Vehículo</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map(o => (
                  <tr key={o.id_orden} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{o.vehiculo.marca} {o.vehiculo.modelo} ({o.vehiculo.placa})</td>
                    <td className="px-6 py-4">{o.vehiculo.cliente.usuario.nombre}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wider">
                        {o.estado_actual.nombre_estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400">{new Date(o.fecha_ingreso).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard for Mechanic (3)
  if (id_rol === 3) {
    let myOrders: any[] = []
    let stats = { activas: 0, completadas: 0 }

    try {
      const mecanico = await prisma.mecanico.findUnique({ where: { id_usuario: parseInt(user.id_usuario) } })
      if (mecanico) {
        const [activas, completas, orders] = await Promise.all([
          prisma.ordenTrabajo.count({
            where: {
              id_mecanico: mecanico.id_mecanico,
              estado_actual: { nombre_estado: { notIn: ['Listo para entrega', 'Entregado', 'Cancelado'] } }
            }
          }),
          prisma.ordenTrabajo.count({
            where: {
              id_mecanico: mecanico.id_mecanico,
              estado_actual: { nombre_estado: { in: ['Listo para entrega', 'Entregado'] } }
            }
          }),
          prisma.ordenTrabajo.findMany({
            where: { id_mecanico: mecanico.id_mecanico },
            take: 5,
            orderBy: { fecha_ingreso: 'desc' },
            include: { vehiculo: true, estado_actual: true }
          })
        ])
        stats = { activas, completadas: completas }
        myOrders = orders
      }
    } catch (e) {
      console.error(e)
    }

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="bg-slate-800 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/20">
          <h2 className="text-2xl font-black">Panel del Mecánico</h2>
          <p className="text-slate-300 mt-2">Hola, {user.nombre}. Aquí están tus trabajos asignados.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-4 rounded-xl bg-orange-50 text-orange-600"><Clock /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Órdenes Activas</p>
              <h3 className="text-3xl font-black">{stats.activas}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Completadas este mes</p>
              <h3 className="text-3xl font-black">{stats.completadas}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Mis Trabajos Recientes</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {myOrders.map(o => (
              <div key={o.id_orden} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-bold text-slate-800">{o.vehiculo.marca} {o.vehiculo.modelo} ({o.vehiculo.placa})</p>
                  <p className="text-xs text-slate-500">{o.motivo_ingreso}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                    {o.estado_actual.nombre_estado}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(o.fecha_ingreso).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {myOrders.length === 0 && <p className="p-6 text-center text-slate-400">No tienes órdenes asignadas.</p>}
          </div>
        </div>
      </div>
    )
  }

  return null
}

function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
  const colors: Record<string, string> = {
    orange: 'bg-orange-50 text-orange-600',
    slate: 'bg-slate-50 text-slate-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-black mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${colors[color] || colors.orange}`}>
        {icon}
      </div>
    </div>
  )
}
