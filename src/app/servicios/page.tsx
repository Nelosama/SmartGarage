'use client'

import React, { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  Settings,
  X,
  AlertCircle,
  DollarSign,
  Clock,
  Activity
} from 'lucide-react'

interface Servicio {
  id_servicio: number
  nombre_servicio: string
  descripcion: string | null
  precio_base: number
  duracion_estimada_min: number | null
  intervalo_km: number | null
  intervalo_meses: number | null
  estado: string
}

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null)

  // Form states
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precioBase, setPrecioBase] = useState<number>(0)
  const [duracion, setDuracion] = useState<string>('')
  const [intervaloKm, setIntervaloKm] = useState<string>('')
  const [intervaloMeses, setIntervaloMeses] = useState<string>('')
  const [estado, setEstado] = useState('Activo')

  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchServicios = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/servicios')
      if (!res.ok) throw new Error('Error al obtener servicios')
      const data = await res.json()
      setServicios(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServicios()
  }, [])

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedServicio(null)
    setNombre('')
    setDescripcion('')
    setPrecioBase(0)
    setDuracion('')
    setIntervaloKm('')
    setIntervaloMeses('')
    setEstado('Activo')
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (s: Servicio) => {
    setModalMode('edit')
    setSelectedServicio(s)
    setNombre(s.nombre_servicio)
    setDescripcion(s.descripcion || '')
    setPrecioBase(Number(s.precio_base))
    setDuracion(s.duracion_estimada_min?.toString() || '')
    setIntervaloKm(s.intervalo_km?.toString() || '')
    setIntervaloMeses(s.intervalo_meses?.toString() || '')
    setEstado(s.estado)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setFormSubmitting(true)
      const url = modalMode === 'create' ? '/api/servicios' : `/api/servicios/${selectedServicio?.id_servicio}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'

      const body = {
        nombre_servicio: nombre,
        descripcion,
        precio_base: Number(precioBase),
        duracion_estimada_min: duracion ? parseInt(duracion, 10) : null,
        intervalo_km: intervaloKm ? parseInt(intervaloKm, 10) : null,
        intervalo_meses: intervaloMeses ? parseInt(intervaloMeses, 10) : null,
        estado
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.details || data.error || 'Error al procesar')
      }

      setIsModalOpen(false)
      fetchServicios()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro?')) return
    try {
      const res = await fetch(`/api/servicios/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      fetchServicios()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const filteredServicios = servicios.filter(s =>
    s.nombre_servicio.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Catálogo de Servicios</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Definición de trabajos y precios base</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" /> Nuevo Servicio
        </button>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar servicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-6">Servicio</th>
                <th className="py-3 px-6">Precio Base</th>
                <th className="py-3 px-6 text-center">Intervalos</th>
                <th className="py-3 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredServicios.map(s => (
                <tr key={s.id_servicio} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{s.nombre_servicio}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{s.descripcion}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-blue-600 dark:text-blue-400">${Number(s.precio_base).toFixed(2)}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-3 text-[10px] font-semibold text-slate-500">
                      {s.intervalo_km && <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{s.intervalo_km} km</span>}
                      {s.intervalo_meses && <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{s.intervalo_meses} meses</span>}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(s)} className="p-1.5 text-slate-400 hover:text-blue-600"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(s.id_servicio)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">{modalMode === 'create' ? 'Nuevo Servicio' : 'Editar Servicio'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400"><X /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre del Servicio</label>
                <input required value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Descripción</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Precio Base ($)</label>
                  <input type="number" step="0.01" required value={precioBase} onChange={e => setPrecioBase(parseFloat(e.target.value))} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Estado</label>
                  <select value={estado} onChange={e => setEstado(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm">
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Duración (min)</label>
                  <input type="number" value={duracion} onChange={e => setDuracion(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Int. KM</label>
                  <input type="number" value={intervaloKm} onChange={e => setIntervaloKm(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Int. Meses</label>
                  <input type="number" value={intervaloMeses} onChange={e => setIntervaloMeses(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400">Cancelar</button>
                <button type="submit" disabled={formSubmitting} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm disabled:opacity-50 transition-colors">
                  {formSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : (modalMode === 'create' ? 'Guardar' : 'Actualizar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
