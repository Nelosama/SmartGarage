import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Car, ClipboardList, Bell, History, Lock } from 'lucide-react'
import ChangePasswordSection from '@/components/ChangePasswordSection'

export const dynamic = 'force-dynamic'

export default async function ClientDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = session.user as any
  if (user.id_rol !== 4) redirect('/')

  let myVehicles: any[] = []
  let myActiveOrders: any[] = []
  let myAlerts: any[] = []

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id_usuario: Number(user.id_usuario) },
    })

    if (cliente) {
      const [vehiculos, orders, alerts] = await Promise.all([
        prisma.vehiculo.findMany({
          where: { id_cliente: cliente.id_cliente },
        }),

        prisma.ordenTrabajo.findMany({
          where: {
            vehiculo: {
              id_cliente: cliente.id_cliente,
            },
            estado_actual: {
              nombre_estado: {
                notIn: ['Entregado', 'Cancelado'],
              },
            },
          },
          include: {
            vehiculo: {
              include: {
                cliente: {
                  include: {
                    usuario: true,
                  },
                },
              },
            },
            estado_actual: true,
            mecanico: {
              include: {
                usuario: true,
              },
            },
            diagnostico: true,
            historial_estados: {
              include: {
                estado: true,
                usuario: true,
              },
              orderBy: {
                fecha_hora: 'desc',
              },
              take: 1,
            },
          },
          orderBy: {
            fecha_ingreso: 'desc',
          },
        }),

        prisma.alertaMantenimiento.findMany({
          where: {
            vehiculo: {
              id_cliente: cliente.id_cliente,
            },
            estado: 'Pendiente',
          },
          include: {
            vehiculo: true,
            servicio: true,
            orden_origen: {
              include: {
                estado_actual: true,
                diagnostico: true,
                historial_estados: {
                  include: {
                    estado: true,
                    usuario: true,
                  },
                  orderBy: {
                    fecha_hora: 'desc',
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: {
            fecha_generada: 'desc',
          },
        }),
      ])

      const alertasDesdeDiagnostico = orders
        .filter((orden: any) => orden.diagnostico)
        .filter((orden: any) => {
          return !alerts.some((alerta: any) => alerta.id_orden_origen === orden.id_orden)
        })
        .map((orden: any) => ({
          id_alerta: `diagnostico-${orden.id_orden}`,
          es_alerta_diagnostico: true,
          id_orden_origen: orden.id_orden,
          estado: 'Pendiente',
          mensaje: `Diagnóstico registrado: ${orden.diagnostico.falla_reportada}`,
          vehiculo: orden.vehiculo,
          servicio: {
            nombre_servicio: 'Diagnóstico del mecánico',
          },
          orden_origen: {
            ...orden,
            diagnostico: orden.diagnostico,
          },
        }))

      myVehicles = vehiculos
      myActiveOrders = orders
      myAlerts = [...alerts, ...alertasDesdeDiagnostico]
    }
  } catch (e) {
    console.error(e)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-orange-600 rounded-3xl p-8 text-white shadow-xl shadow-orange-500/20">
        <h2 className="text-2xl font-black">Mi SmartGarage</h2>
        <p className="text-orange-100 mt-2">
          Bienvenido, {user.nombre}. Aquí puedes ver el estado de tus vehículos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-xl bg-orange-50 text-orange-600">
            <Car />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Mis Vehículos</p>
            <h3 className="text-3xl font-black">{myVehicles.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-xl bg-blue-50 text-blue-600">
            <ClipboardList />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Órdenes Activas</p>
            <h3 className="text-3xl font-black">{myActiveOrders.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-xl bg-red-50 text-red-600">
            <Bell />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Alertas</p>
            <h3 className="text-3xl font-black">{myAlerts.length}</h3>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <History className="h-5 w-5 text-orange-600" />
              Órdenes en Curso
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {myActiveOrders.map((o) => (
              <div key={o.id_orden} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-bold text-slate-800">
                      {o.vehiculo.marca} {o.vehiculo.modelo}
                    </p>

                    <p className="text-xs text-slate-500">
                      Placa: {o.vehiculo.placa}
                    </p>

                    {o.mecanico?.usuario?.nombre && (
                      <p className="text-xs text-slate-500 mt-1">
                        Mecánico asignado: {o.mecanico.usuario.nombre}
                      </p>
                    )}
                  </div>

                  <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold uppercase">
                    {o.estado_actual.nombre_estado}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-600 italic">
                  "{o.motivo_ingreso}"
                </p>

                {o.historial_estados?.[0]?.comentario && (
                  <p className="mt-2 text-xs text-slate-500">
                    Última actualización: {o.historial_estados[0].comentario}
                  </p>
                )}
              </div>
            ))}

            {myActiveOrders.length === 0 && (
              <p className="p-8 text-center text-slate-400">
                No tienes órdenes activas en este momento.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              Alertas de Mantenimiento
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {myAlerts.map((a) => {
              const diagnostico = a.orden_origen?.diagnostico

              return (
                <div key={a.id_alerta} className="p-4 hover:bg-red-50 transition-colors">
                  <p className="text-xs text-slate-600">
                    {a.vehiculo.marca} {a.vehiculo.modelo} ({a.vehiculo.placa})
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-700">
                    Servicio sugerido:{' '}
                    {a.servicio?.nombre_servicio || 'Servicio no especificado'}
                  </p>

                  <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase">
                    Estado actual:{' '}
                    {a.orden_origen?.estado_actual?.nombre_estado || 'Sin estado registrado'}
                  </p>

                  {diagnostico ? (
                    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs">
                      <p className="font-black text-blue-700 uppercase mb-1">
                        Diagnóstico relacionado
                      </p>

                      <p className="text-slate-700">
                        <span className="font-bold">Falla reportada:</span>{' '}
                        {diagnostico.falla_reportada}
                      </p>

                      {diagnostico.causa_detectada && (
                        <p className="text-slate-600 mt-1">
                          <span className="font-bold">Causa detectada:</span>{' '}
                          {diagnostico.causa_detectada}
                        </p>
                      )}

                      {diagnostico.recomendacion && (
                        <p className="text-slate-600 mt-1">
                          <span className="font-bold">Recomendación:</span>{' '}
                          {diagnostico.recomendacion}
                        </p>
                      )}

                      {diagnostico.observaciones && (
                        <p className="text-slate-500 mt-1">
                          <span className="font-bold">Observaciones:</span>{' '}
                          {diagnostico.observaciones}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">
                      {a.orden_origen?.historial_estados?.[0]?.comentario ||
                        a.orden_origen?.observaciones ||
                        a.mensaje ||
                        'Sin observaciones registradas'}
                    </p>
                  )}
                </div>
              )
            })}

            {myAlerts.length === 0 && (
              <p className="p-8 text-center text-slate-400">
                No tienes alertas pendientes.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
          <Lock className="h-5 w-5 text-orange-600" />
          Configuración de Seguridad
        </h3>

        <ChangePasswordSection />
      </div>
    </div>
  )
}