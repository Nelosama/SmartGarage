'use client'
import { useState, useEffect } from 'react'
import { History, Search, Clock, ArrowRight } from 'lucide-react'
export default function HistorialPage() {
  const [historial, setHistorial] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/historial_estados_orden').then(res => res.json()).then(data => {
      setHistorial(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <History className="h-8 w-8 text-orange-600" />
          Historial de Cambios
        </h1>
        <p className="text-slate-500 text-sm">Registro de transiciones de estado por orden.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="px-6 py-4">Orden</th>
                <th className="px-6 py-4">Estado Anterior</th>
                <th className="px-6 py-4 text-center"><ArrowRight className="h-4 w-4 mx-auto" /></th>
                <th className="px-6 py-4">Estado Nuevo</th>
                <th className="px-6 py-4 text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Cargando...</td></tr>
              ) : historial.map(h => (
                <tr key={h.id_historial_estado} className="hover:bg-slate-50 transition-colors">
  <td className="px-6 py-4 font-bold text-slate-800">#{h.id_orden}</td>
  <td className="px-6 py-4">
    <span className="text-slate-400 font-medium">Cambio registrado</span>
  </td>
  <td className="px-6 py-4 text-center">
    <ArrowRight className="h-3 w-3 text-slate-300 mx-auto" />
  </td>
  <td className="px-6 py-4">
    <span className="font-bold text-orange-600">{h.estado?.nombre_estado || 'N/A'}</span>
  </td>
  <td className="px-6 py-4 text-right text-xs text-slate-400">
    {h.fecha_hora ? new Date(h.fecha_hora).toLocaleString('es-HN') : 'N/A'}
  </td>
</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}