'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Search,
  Plus,
  Pencil,
  X,
  Save,
  AlertCircle,
  Car,
  User,
  Wrench,
} from 'lucide-react'
const emptyForm = {
  id_orden: '',
  falla_reportada: '',
  causa_detectada: '',
  recomendacion: '',
  observaciones: '',
}
export default function DiagnosticosPage() {
  const [diagnosticos, setDiagnosticos] = useState<any[]>([])
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDiagnostico, setEditingDiagnostico] = useState<any | null>(null)
  const [form, setForm] = useState(emptyForm)
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [diagnosticosRes, ordenesRes] = await Promise.all([
        fetch('/api/diagnosticos'),
        fetch('/api/ordenes'),
      ])
      const diagnosticosData = await diagnosticosRes.json()
      const ordenesData = await ordenesRes.json()
      setDiagnosticos(Array.isArray(diagnosticosData) ? diagnosticosData : [])
      setOrdenes(Array.isArray(ordenesData) ? ordenesData : [])
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchData()
  }, [])
  const filteredDiagnosticos = useMemo(() => {
    return diagnosticos.filter((d) => {
      const orden = d.orden
      const vehiculo = orden?.vehiculo
      const cliente = vehiculo?.cliente?.usuario?.nombre || ''
      const mecanico = orden?.mecanico?.usuario?.nombre || ''
      const text = `
        ${d.id_orden}
        ${d.falla_reportada}
        ${d.causa_detectada}
        ${d.recomendacion}
        ${d.observaciones}
        ${vehiculo?.marca || ''}
        ${vehiculo?.modelo || ''}
        ${vehiculo?.placa || ''}
        ${cliente}
        ${mecanico}
      `.toLowerCase()
      return text.includes(search.toLowerCase())
    })
  }, [diagnosticos, search])
  const selectedOrden = useMemo(() => {
    if (!form.id_orden) return null
    return ordenes.find((o) => Number(o.id_orden) === Number(form.id_orden)) || null
  }, [form.id_orden, ordenes])
  const openCreateModal = () => {
    setEditingDiagnostico(null)
    setForm(emptyForm)
    setError(null)
    setModalOpen(true)
  }
  const openEditModal = (diagnostico: any) => {
    setEditingDiagnostico(diagnostico)
    setForm({
      id_orden: String(diagnostico.id_orden || ''),
      falla_reportada: diagnostico.falla_reportada || '',
      causa_detectada: diagnostico.causa_detectada || '',
      recomendacion: diagnostico.recomendacion || '',
      observaciones: diagnostico.observaciones || '',
    })
    setError(null)
    setModalOpen(true)
  }
  const closeModal = () => {
    if (submitting) return
    setModalOpen(false)
    setEditingDiagnostico(null)
    setForm(emptyForm)
    setError(null)
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.id_orden) {
      setError('Debes seleccionar una orden')
      return
    }
    if (!form.falla_reportada.trim()) {
      setError('La falla reportada es requerida')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      const url = editingDiagnostico
        ? `/api/diagnosticos/${editingDiagnostico.id_diagnostico}`
        : '/api/diagnosticos'
      const method = editingDiagnostico ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_orden: Number(form.id_orden),
          falla_reportada: form.falla_reportada.trim(),
          causa_detectada: form.causa_detectada.trim() || null,
          recomendacion: form.recomendacion.trim() || null,
          observaciones: form.observaciones.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.details || data?.error || 'Error al guardar diagnóstico')
      }
      await fetchData()
      closeModal()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Activity className="h-8 w-8 text-orange-600" />
            Diagnósticos
          </h1>
          <p className="text-slate-500 text-sm">
            Registro de fallas y causas detectadas por orden.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar diagnóstico..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Agregar Diagnóstico
          </button>
        </div>
      </div>
      {error && !modalOpen && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="px-6 py-4">Orden</th>
                <th className="px-6 py-4">Falla Reportada</th>
                <th className="px-6 py-4">Causa Detectada</th>
                <th className="px-6 py-4">Recomendación</th>
                <th className="px-6 py-4">Observaciones</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Cargando diagnósticos...
                  </td>
                </tr>
              ) : filteredDiagnosticos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="h-10 w-10 text-slate-200" />
                      <p className="text-slate-500 font-medium">
                        No hay diagnósticos para mostrar.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDiagnosticos.map((d) => (
                  <tr key={d.id_diagnostico} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-black text-orange-600">#{d.id_orden}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {d.orden?.vehiculo?.marca} {d.orden?.vehiculo?.modelo} -{' '}
                        {d.orden?.vehiculo?.placa}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                        {d.orden?.estado_actual?.nombre_estado || 'Sin estado'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {d.falla_reportada || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {d.causa_detectada || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {d.recomendacion || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {d.observaciones || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(d)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 text-xs font-bold transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[calc(100vh-2rem)] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  {editingDiagnostico ? 'Editar Diagnóstico' : 'Agregar Diagnóstico'}
                </h2>
                <p className="text-sm text-slate-500">
                  Selecciona una orden y registra la falla detectada.
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
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Orden de Trabajo
                </label>
                <select
                  value={form.id_orden}
                  disabled={!!editingDiagnostico}
                  onChange={(e) => setForm({ ...form, id_orden: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500 disabled:bg-slate-100"
                >
                  <option value="">Seleccionar orden...</option>
                  {ordenes.map((o) => (
                    <option key={o.id_orden} value={o.id_orden}>
                      Orden #{o.id_orden} - {o.vehiculo?.marca} {o.vehiculo?.modelo} -{' '}
                      {o.vehiculo?.placa}
                    </option>
                  ))}
                </select>
              </div>
              {selectedOrden && (
                <div className="grid gap-3 md:grid-cols-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <div className="flex items-start gap-2">
                    <Car className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Vehículo
                      </p>
                      <p className="text-sm font-bold text-slate-700">
                        {selectedOrden.vehiculo?.marca} {selectedOrden.vehiculo?.modelo}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedOrden.vehiculo?.placa}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Cliente
                      </p>
                      <p className="text-sm font-bold text-slate-700">
                        {selectedOrden.vehiculo?.cliente?.usuario?.nombre || 'No registrado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Wrench className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Mecánico
                      </p>
                      <p className="text-sm font-bold text-slate-700">
                        {selectedOrden.mecanico?.usuario?.nombre || 'Sin asignar'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Falla Reportada
                </label>
                <textarea
                  value={form.falla_reportada}
                  onChange={(e) => setForm({ ...form, falla_reportada: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500 resize-none"
                  placeholder="Ejemplo: El vehículo presenta ruido al frenar..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Causa Detectada
                </label>
                <textarea
                  value={form.causa_detectada}
                  onChange={(e) => setForm({ ...form, causa_detectada: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500 resize-none"
                  placeholder="Ejemplo: Pastillas de freno desgastadas..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Recomendación
                </label>
                <textarea
                  value={form.recomendacion}
                  onChange={(e) => setForm({ ...form, recomendacion: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500 resize-none"
                  placeholder="Ejemplo: Reemplazar pastillas y revisar discos..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Observaciones
                </label>
                <textarea
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500 resize-none"
                  placeholder="Observaciones adicionales..."
                />
              </div>
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
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {submitting
                    ? 'Guardando...'
                    : editingDiagnostico
                      ? 'Actualizar Diagnóstico'
                      : 'Guardar Diagnóstico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}