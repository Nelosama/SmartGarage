'use client'

import { useState, useEffect } from 'react'
import { Stethoscope, Plus, Search, FileText, ChevronRight } from 'lucide-react'

export default function DiagnosticosPage() {
  const [diagnosticos, setDiagnosticos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/diagnosticos').then(res => res.json()).then(data => {
      setDiagnosticos(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-orange-600" />
            Diagnósticos
          </h1>
          <p className="text-slate-500 text-sm">Registro de fallas y causas detectadas por orden.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="px-6 py-4">Orden</th>
                <th className="px-6 py-4">Falla Reportada</th>
                <th className="px-6 py-4">Causa Detectada</th>
                <th className="px-6 py-4">Recomendación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Cargando...</td></tr>
              ) : diagnosticos.map(d => (
                <tr key={d.id_diagnostico} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-orange-600">#{d.id_orden}</td>
                  <td className="px-6 py-4 text-slate-700">{d.falla_reportada}</td>
                  <td className="px-6 py-4 text-slate-700">{d.causa_detectada}</td>
                  <td className="px-6 py-4 text-slate-700">{d.recomendacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
