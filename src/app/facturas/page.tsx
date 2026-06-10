'use client'

import { useState, useEffect } from 'react'
import { Receipt, Search, Download, CheckCircle2, Clock } from 'lucide-react'

export default function FacturasPage() {
  const [facturas, setFacturas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/facturas').then(res => res.json()).then(data => {
      setFacturas(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <Receipt className="h-8 w-8 text-orange-600" />
          Facturación
        </h1>
        <p className="text-slate-500 text-sm">Resumen de totales y estados de pago.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="px-6 py-4">Orden</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Impuesto</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4">Método</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Cargando...</td></tr>
              ) : facturas.map(f => (
                <tr key={f.id_factura} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">#{f.id_orden}</td>
                  <td className="px-6 py-4 font-black text-orange-600">L {Number(f.total).toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-500">L {Number(f.impuesto).toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${f.estado_pago === 'Pagado' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {f.estado_pago}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{f.metodo_pago}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
