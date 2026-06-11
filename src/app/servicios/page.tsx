'use client'

import React, { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  Activity,
  X,
  AlertCircle,
  Clock
} from 'lucide-react'

interface Servicio {
  id_servicio: number
  nombre_servicio: string
  descripcion: string | null
  precio_base: number
  duracion_estimada_min: number | null
  estado: string
}

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null)

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState<number>(0)
  const [duracion, setDuracion] = useState<number>(0)
  const [estado, setEstado] = useState('Activo')

  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/servicios')
      if (!res.ok) throw new Error('Error al obtener datos')
      setServicios(await res.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedServicio(null)
    setNombre('')
    setDescripcion('')
    setPrecio(0)
    setDuracion(0)
    setEstado('Activo')
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (s: Servicio) => {
    setModalMode('edit')
    setSelectedServicio(s)
    setNombre(s.nombre_servicio)
    setDescripcion(s.descripcion || '')
    setPrecio(Number(s.precio_base))
    setDuracion(s.duracion_estimada_min || 0)
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
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_servicio: nombre,
          descripcion,
          precio_base: precio,
          duracion_estimada_min: duracion,
          estado
        })
      })
      if (!res.ok) throw new Error('Error al procesar')
      setIsModalOpen(false)
      fetchData()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const filtered = servicios.filter(s => s.nombre_servicio.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Activity className="h-8 w-8 text-orange-600" />
            Catálogo de Servicios
          </h1>
          <p className="text-slate-500 text-sm">Definición de servicios y precios base.</p>
        </div>
        <button onClick={openCreateModal} className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 active:scale-95 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nuevo Servicio
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="px-6 py-4">Servicio</th>
                <th className="px-6 py-4">Precio Base</th>
                <th className="px-6 py-4 text-center">Duración</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Cargando...</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id_servicio} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{s.nombre_servicio}</p>
                    <p className="text-xs text-slate-500 truncate max-w-xs">{s.descripcion}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-orange-600">L {Number(s.precio_base).toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="flex items-center justify-center gap-1.5 text-slate-500 text-xs"><Clock className="h-3 w-3" /> {s.duracion_estimada_min} min</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(s)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"><Edit2 className="h-4 w-4" /></button>
                      <button className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">Servicio</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                  <input required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={nombre} onChange={e => setNombre(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio Base</label>
                  <input type="number" step="0.01" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={precio} onChange={e => setPrecio(Number(e.target.value))} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Cancelar</button>
                <button type="submit" disabled={formSubmitting} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 active:scale-95">{formSubmitting ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
