'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, AlertTriangle, CheckCircle, Car } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface AlertaResumen {
  id_alerta: number
  mensaje: string
  estado: string
  fecha_objetivo: string | null
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

export default function AlertasPage() {
  const { status } = useSession()
  const [alertas, setAlertas] = useState<AlertaResumen[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlertas = useCallback(async () => {
    try {
      const res = await fetch('/api/alertas_mantenimiento')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setAlertas(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching alertas:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true;
    if (status === 'authenticated') {
      (async () => {
        if (!mounted) return;
        await fetchAlertas();
      })();
    }
    return () => { mounted = false };
  }, [status, fetchAlertas])

  if (status === 'loading') {
    return <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Cargando datos de sesión...</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <Bell className="h-8 w-8 text-orange-600" />
          Alertas de Mantenimiento
        </h1>
        <p className="text-slate-500 text-sm">Notificaciones preventivas basadas en el kilometraje.</p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p className="text-center text-slate-400 py-12">Cargando alertas...</p>
        ) : alertas.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="font-bold text-slate-800">Todo en orden</h3>
            <p className="text-slate-500 text-sm">No hay alertas de mantenimiento pendientes.</p>
          </div>
        ) : alertas.map(a => (
          <div key={a.id_alerta} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:border-orange-200 transition-colors">
            <div className={`p-3 rounded-xl ${a.estado === 'Pendiente' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-800">
  {a.servicio?.nombre_servicio || 'Alerta de mantenimiento'}
</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                  ID #{a.id_alerta}
                </span>
              </div>
             <p className="text-sm text-slate-600 mt-1">
  {a.mensaje}
</p>
              <div className="mt-4 flex items-center gap-6 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-700 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                  <Car className="h-4 w-4 text-orange-600" />
                  {a.vehiculo ? `${a.vehiculo.marca} ${a.vehiculo.modelo} - ${a.vehiculo.placa}` : `Vehiculo #${a.id_vehiculo}`}
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  Fecha: {a.fecha_objetivo && !isNaN(new Date(a.fecha_objetivo).getTime())
  ? new Date(a.fecha_objetivo).toLocaleDateString()
  : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
