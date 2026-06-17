'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Car,
  Plus,
  X,
  Save,
  Calendar,
  Gauge,
  AlertCircle,
} from 'lucide-react'
import { useSession } from 'next-auth/react'

interface AlertaResumen {
  id_alerta: number
  mensaje: string
  estado: string
  fecha_objetivo: string | null
  kilometraje_referencia?: number | null
  kilometraje_objetivo?: number | null
  servicio?: {
    nombre_servicio: string
  } | null
  vehiculo?: {
    marca: string
    modelo: string
    placa: string
  } | null
  id_vehiculo: number
}

const emptyForm = {
  id_orden_origen: '',
  id_servicio: '',
  kilometraje_referencia: '',
  kilometraje_objetivo: '',
  fecha_objetivo: '',
  mensaje: '',
}

export default function AlertasPage() {
  const { data: session, status } = useSession()
  const user = session?.user as any

  const [alertas, setAlertas] = useState<AlertaResumen[]>([])
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [servicios, setServicios] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const canCreateAlert = user?.id_rol === 1 || user?.id_rol === 2 || user?.id_rol === 3

  const selectedOrden = useMemo(() => {
    if (!form.id_orden_origen) return null

    return (
      ordenes.find((o) => Number(o.id_orden) === Number(form.id_orden_origen)) ||
      null
    )
  }, [form.id_orden_origen, ordenes])

  const obtenerUltimoKilometraje = (ordenSeleccionada: any) => {
    if (!ordenSeleccionada?.id_vehiculo) return ''

    const idVehiculo = Number(ordenSeleccionada.id_vehiculo)

    const ordenesDelVehiculo = ordenes
      .filter((o) => Number(o.id_vehiculo) === idVehiculo)
      .filter((o) => Number(o.kilometraje_ingreso || 0) > 0)
      .sort((a, b) => {
        const fechaA = new Date(a.fecha_ingreso || 0).getTime()
        const fechaB = new Date(b.fecha_ingreso || 0).getTime()
        return fechaB - fechaA
      })

    const ultimoKmOrden = Number(ordenesDelVehiculo[0]?.kilometraje_ingreso || 0)

    if (ultimoKmOrden > 0) {
      return String(ultimoKmOrden)
    }

    const kmVehiculo = Number(ordenSeleccionada.vehiculo?.kilometraje_actual || 0)

    if (kmVehiculo > 0) {
      return String(kmVehiculo)
    }

    return ''
  }

  const calcularKilometrajeObjetivo = (
    kilometrajeActual: string,
    idServicio: string
  ) => {
    const kmActual = Number(kilometrajeActual || 0)

    if (!kmActual || kmActual <= 0 || !idServicio) {
      return ''
    }

    const servicio = servicios.find(
      (s) => Number(s.id_servicio) === Number(idServicio)
    )

    const nombreServicio = servicio?.nombre_servicio?.toLowerCase() || ''

    if (nombreServicio.includes('aceite')) {
      return String(kmActual + 5000)
    }

    return ''
  }

  const generarMensajeCambioAceite = (
    kilometrajeActual: string,
    kilometrajeObjetivo: string,
    idServicio: string
  ) => {
    const servicio = servicios.find(
      (s) => Number(s.id_servicio) === Number(idServicio)
    )

    const nombreServicio = servicio?.nombre_servicio?.toLowerCase() || ''

    if (!nombreServicio.includes('aceite')) return ''
    if (!kilometrajeActual || !kilometrajeObjetivo) return ''

    return `Se recomienda realizar cambio de aceite al llegar a los ${Number(
      kilometrajeObjetivo
    ).toLocaleString()} km. Kilometraje actual registrado: ${Number(
      kilometrajeActual
    ).toLocaleString()} km.`
  }

  const fetchAlertas = useCallback(async () => {
    try {
      setLoading(true)

      const res = await fetch('/api/alertas_mantenimiento')

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.details || data?.error || 'Error al cargar alertas')
      }

      const data = await res.json()
      setAlertas(Array.isArray(data) ? data : [])
      setError(null)
    } catch (error: any) {
      setError(error.message || 'Error al cargar alertas')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchFormData = useCallback(async () => {
    try {
      setFormLoading(true)

      const [ordenesRes, serviciosRes] = await Promise.all([
        fetch('/api/ordenes'),
        fetch('/api/servicios'),
      ])

      const ordenesData = await ordenesRes.json().catch(() => [])
      const serviciosData = await serviciosRes.json().catch(() => [])

      setOrdenes(Array.isArray(ordenesData) ? ordenesData : [])
      setServicios(Array.isArray(serviciosData) ? serviciosData : [])
    } catch (error) {
      console.error('Error cargando datos del formulario:', error)
    } finally {
      setFormLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAlertas()
      fetchFormData()
    }
  }, [status, fetchAlertas, fetchFormData])

  const openCreateModal = () => {
    setForm(emptyForm)
    setFormError(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (submitting) return

    setIsModalOpen(false)
    setForm(emptyForm)
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.id_orden_origen) {
      setFormError('Debes seleccionar una orden de trabajo')
      return
    }

    if (!selectedOrden?.vehiculo?.id_vehiculo) {
      setFormError('No se pudo identificar el vehículo de la orden seleccionada')
      return
    }

    if (!form.id_servicio) {
      setFormError('Debes seleccionar el servicio recomendado')
      return
    }

    if (!form.mensaje.trim()) {
      setFormError('El mensaje de la alerta es requerido')
      return
    }

    try {
      setSubmitting(true)
      setFormError(null)

      const res = await fetch('/api/alertas_mantenimiento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_vehiculo: selectedOrden.vehiculo.id_vehiculo,
          id_servicio: Number(form.id_servicio),
          id_orden_origen: Number(form.id_orden_origen),
          kilometraje_referencia: form.kilometraje_referencia
            ? Number(form.kilometraje_referencia)
            : null,
          kilometraje_objetivo: form.kilometraje_objetivo
            ? Number(form.kilometraje_objetivo)
            : null,
          fecha_objetivo: form.fecha_objetivo || null,
          mensaje: form.mensaje.trim(),
          estado: 'Pendiente',
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.details || data?.error || 'Error al crear alerta')
      }

      closeModal()
      await fetchAlertas()
    } catch (error: any) {
      setFormError(error.message || 'Error al crear alerta')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="p-8 text-center text-slate-400 font-bold animate-pulse">
        Cargando datos de sesión...
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Bell className="h-8 w-8 text-orange-600" />
            Alertas de Mantenimiento
          </h1>
          <p className="text-slate-500 text-sm">
            Notificaciones preventivas basadas en kilometraje, fecha o recomendación del mecánico.
          </p>
        </div>

        {canCreateAlert && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Crear Alerta
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <p className="text-center text-slate-400 py-12">Cargando alertas...</p>
        ) : alertas.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="font-bold text-slate-800">Todo en orden</h3>
            <p className="text-slate-500 text-sm">
              No hay alertas de mantenimiento pendientes.
            </p>
          </div>
        ) : (
          alertas.map((a) => (
            <div
              key={a.id_alerta}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:border-orange-200 transition-colors"
            >
              <div
                className={`p-3 rounded-xl ${
                  a.estado === 'Pendiente'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <AlertTriangle className="h-6 w-6" />
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start gap-3">
                  <h3 className="font-bold text-slate-800">
                    {a.servicio?.nombre_servicio || 'Alerta de mantenimiento'}
                  </h3>

                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                    ID #{a.id_alerta}
                  </span>
                </div>

                <p className="text-sm text-slate-600 mt-1">{a.mensaje}</p>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-700 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                    <Car className="h-4 w-4 text-orange-600" />
                    {a.vehiculo
                      ? `${a.vehiculo.marca} ${a.vehiculo.modelo} - ${a.vehiculo.placa}`
                      : `Vehículo #${a.id_vehiculo}`}
                  </span>

                  <span className="flex items-center gap-1.5 text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    <Calendar className="h-4 w-4" />
                    Fecha:{' '}
                    {a.fecha_objetivo && !isNaN(new Date(a.fecha_objetivo).getTime())
                      ? new Date(a.fecha_objetivo).toLocaleDateString()
                      : 'N/A'}
                  </span>

                  <span className="flex items-center gap-1.5 text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    <Gauge className="h-4 w-4" />
                    KM objetivo: {a.kilometraje_objetivo || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[calc(100vh-2rem)] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  Crear Alerta de Mantenimiento
                </h2>
                <p className="text-sm text-slate-500">
                  La alerta aparecerá en el dashboard del cliente.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
                title="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
              {formError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {formError}
                </div>
              )}

              {formLoading ? (
                <p className="text-center text-slate-400 py-8">
                  Cargando órdenes y servicios...
                </p>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Orden de Trabajo
                    </label>

                    <select
                      value={form.id_orden_origen}
                      onChange={(e) => {
                        const idOrden = e.target.value

                        const ordenSeleccionada = ordenes.find(
                          (o) => Number(o.id_orden) === Number(idOrden)
                        )

                        const kmActual = obtenerUltimoKilometraje(ordenSeleccionada)
                        const kmObjetivo = calcularKilometrajeObjetivo(
                          kmActual,
                          form.id_servicio
                        )

                        const mensajeSugerido = generarMensajeCambioAceite(
                          kmActual,
                          kmObjetivo,
                          form.id_servicio
                        )

                        setForm({
                          ...form,
                          id_orden_origen: idOrden,
                          kilometraje_referencia: kmActual,
                          kilometraje_objetivo: kmObjetivo,
                          mensaje: form.mensaje || mensajeSugerido,
                        })
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Seleccionar orden...</option>

                      {ordenes.map((o) => (
                        <option key={o.id_orden} value={o.id_orden}>
                          Orden #{o.id_orden} - {o.vehiculo?.marca}{' '}
                          {o.vehiculo?.modelo} - {o.vehiculo?.placa}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedOrden && (
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-sm">
                      <p className="font-black text-slate-800 flex items-center gap-2">
                        <Car className="h-4 w-4 text-orange-600" />
                        {selectedOrden.vehiculo?.marca} {selectedOrden.vehiculo?.modelo}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Placa: {selectedOrden.vehiculo?.placa}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Cliente:{' '}
                        {selectedOrden.vehiculo?.cliente?.usuario?.nombre ||
                          'No registrado'}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Último kilometraje registrado:{' '}
                        {form.kilometraje_referencia
                          ? `${Number(form.kilometraje_referencia).toLocaleString()} km`
                          : 'No registrado'}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Servicio recomendado
                    </label>

                    <select
                      value={form.id_servicio}
                      onChange={(e) => {
                        const idServicio = e.target.value

                        const kmObjetivo = calcularKilometrajeObjetivo(
                          form.kilometraje_referencia,
                          idServicio
                        )

                        const mensajeSugerido = generarMensajeCambioAceite(
                          form.kilometraje_referencia,
                          kmObjetivo,
                          idServicio
                        )

                        setForm({
                          ...form,
                          id_servicio: idServicio,
                          kilometraje_objetivo: kmObjetivo,
                          mensaje: form.mensaje || mensajeSugerido,
                        })
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Seleccionar servicio...</option>

                      {servicios.map((s) => (
                        <option key={s.id_servicio} value={s.id_servicio}>
                          {s.nombre_servicio}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                        Kilometraje actual / referencia
                      </label>

                      <input
                        type="number"
                        value={form.kilometraje_referencia}
                        onChange={(e) => {
                          const kmActual = e.target.value

                          const kmObjetivo = calcularKilometrajeObjetivo(
                            kmActual,
                            form.id_servicio
                          )

                          const mensajeSugerido = generarMensajeCambioAceite(
                            kmActual,
                            kmObjetivo,
                            form.id_servicio
                          )

                          setForm({
                            ...form,
                            kilometraje_referencia: kmActual,
                            kilometraje_objetivo: kmObjetivo,
                            mensaje: form.mensaje || mensajeSugerido,
                          })
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                        placeholder="Ejemplo: 85000"
                      />

                      <p className="text-[10px] text-slate-400 mt-1">
                        Se carga automáticamente con el último kilometraje registrado.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                        Kilometraje objetivo
                      </label>

                      <input
                        type="number"
                        value={form.kilometraje_objetivo}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            kilometraje_objetivo: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                        placeholder="Ejemplo: 90000"
                      />

                      <p className="text-[10px] text-slate-400 mt-1">
                        Para cambio de aceite se calcula automáticamente +5,000 km.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Fecha objetivo
                    </label>

                    <input
                      type="date"
                      value={form.fecha_objetivo}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          fecha_objetivo: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Mensaje para el cliente
                    </label>

                    <textarea
                      value={form.mensaje}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          mensaje: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500 resize-none"
                      placeholder="Ejemplo: Se recomienda realizar cambio de aceite al llegar a los 90,000 km o dentro de 3 meses."
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-slate-100 -mx-6 -mb-6 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submitting || formLoading}
                  className="flex-1 px-4 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {submitting ? 'Guardando...' : 'Guardar Alerta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}