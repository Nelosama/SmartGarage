'use client'

import { useState, useEffect } from 'react'
import {
  Stethoscope,
  Search,
  Edit2,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react'

export default function DiagnosticosPage() {
  const [diagnosticos, setDiagnosticos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDiagnostico, setSelectedDiagnostico] = useState<any | null>(null)

  const [fallaReportada, setFallaReportada] = useState('')
  const [causaDetectada, setCausaDetectada] = useState('')
  const [recomendacion, setRecomendacion] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchDiagnosticos = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/diagnosticos')

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Error al cargar diagnósticos')
      }

      const data = await res.json()
      setDiagnosticos(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiagnosticos()
  }, [])

  const openEditModal = (diagnostico: any) => {
    setSelectedDiagnostico(diagnostico)
    setFallaReportada(diagnostico.falla_reportada || '')
    setCausaDetectada(diagnostico.causa_detectada || '')
    setRecomendacion(diagnostico.recomendacion || '')
    setObservaciones(diagnostico.observaciones || '')
    setFormError(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedDiagnostico(null)
    setFallaReportada('')
    setCausaDetectada('')
    setRecomendacion('')
    setObservaciones('')
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDiagnostico) return

    try {
      setFormSubmitting(true)
      setFormError(null)

      if (!fallaReportada.trim()) {
        throw new Error('La falla reportada es requerida')
      }

      const res = await fetch(`/api/diagnosticos/${selectedDiagnostico.id_diagnostico}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          falla_reportada: fallaReportada,
          causa_detectada: causaDetectada,
          recomendacion,
          observaciones,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.details || data?.error || 'Error al actualizar diagnóstico')
      }

      closeModal()
      fetchDiagnosticos()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const filteredDiagnosticos = diagnosticos.filter((d) => {
    const text = `
      ${d.id_orden || ''}
      ${d.falla_reportada || ''}
      ${d.causa_detectada || ''}
      ${d.recomendacion || ''}
      ${d.observaciones || ''}
      ${d.orden?.vehiculo?.placa || ''}
      ${d.orden?.vehiculo?.marca || ''}
      ${d.orden?.vehiculo?.modelo || ''}
    `.toLowerCase()

    return text.includes(search.toLowerCase())
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-orange-600" />
            Diagnósticos
          </h1>
          <p className="text-slate-500 text-sm">
            Registro de fallas y causas detectadas por orden.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar diagnóstico..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
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
                    Cargando...
                  </td>
                </tr>
              ) : filteredDiagnosticos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No hay diagnósticos registrados.
                  </td>
                </tr>
              ) : (
                filteredDiagnosticos.map((d) => (
                  <tr key={d.id_diagnostico} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-orange-600">#{d.id_orden}</p>

                      {d.orden?.vehiculo && (
                        <p className="text-xs text-slate-500 mt-1">
                          {d.orden.vehiculo.marca} {d.orden.vehiculo.modelo} - {d.orden.vehiculo.placa}
                        </p>
                      )}

                      {d.orden?.estado_actual?.nombre_estado && (
                        <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                          {d.orden.estado_actual.nombre_estado}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {d.falla_reportada || 'Sin registrar'}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {d.causa_detectada || 'Sin registrar'}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {d.recomendacion || 'Sin registrar'}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {d.observaciones || 'Sin observaciones'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(d)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
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

      {isModalOpen && selectedDiagnostico && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-orange-600" />
                  Editar Diagnóstico
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Orden #{selectedDiagnostico.id_orden}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Falla reportada
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[80px] focus:outline-none focus:border-orange-500"
                  value={fallaReportada}
                  onChange={(e) => setFallaReportada(e.target.value)}
                  placeholder="Ejemplo: Ruido al frenar..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Causa detectada
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[80px] focus:outline-none focus:border-orange-500"
                  value={causaDetectada}
                  onChange={(e) => setCausaDetectada(e.target.value)}
                  placeholder="Ejemplo: Pastillas delanteras desgastadas..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Recomendación
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[80px] focus:outline-none focus:border-orange-500"
                  value={recomendacion}
                  onChange={(e) => setRecomendacion(e.target.value)}
                  placeholder="Ejemplo: Realizar cambio de pastillas..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Observaciones
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[80px] focus:outline-none focus:border-orange-500"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Observaciones adicionales..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {formSubmitting ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}