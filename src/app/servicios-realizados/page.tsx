'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  ClipboardList,
  Wrench,
  DollarSign,
  Package,
  X,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface Vehiculo {
  placa: string
  marca: string
  modelo: string
  cliente: {
    usuario: {
      nombre: string
    }
  }
}

interface Orden {
  id_orden: number
  motivo_ingreso: string
  estado_actual: {
    nombre_estado: string
  }
  vehiculo: Vehiculo
}

interface ServicioRealizado {
  id_orden_servicio: number
  id_orden: number
  id_servicio: number
  servicio: {
    nombre_servicio: string
    descripcion?: string
  }
  cantidad: number
  precio_unitario: number
  subtotal: number
  observaciones?: string
  orden: Orden
}

function ServiciosRealizadosContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const filterOrdenId = searchParams.get('ordenId')

  const [servicios, setServicios] = useState<ServicioRealizado[]>([])
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [catalogoServicios, setCatalogoServicios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedServicio, setSelectedServicio] = useState<ServicioRealizado | null>(null)

  // Form states
  const [idServicio, setIdServicio] = useState<string>('')
  const [ordenId, setOrdenId] = useState<string>('')
  const [cantidad, setCantidad] = useState<number>(1)
  const [precioUnitario, setPrecioUnitario] = useState<number>(0)
  const [observaciones, setObservaciones] = useState('')

  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch performed services, orders and service catalog
  const fetchData = async (query = '') => {
    try {
      setLoading(true)
      const servURL = `/api/servicios-realizados${filterOrdenId ? `?ordenId=${filterOrdenId}` : ''}${query ? `${filterOrdenId ? '&' : '?'}q=${encodeURIComponent(query)}` : ''}`
      
      const [servRes, ordRes, catRes] = await Promise.all([
        fetch(servURL),
        fetch('/api/ordenes'),
        fetch('/api/servicios')
      ])

      if (!servRes.ok) throw new Error('Error al conectar con el servidor')

      setServicios(await servRes.json())
      setOrdenes(await ordRes.json())
      setCatalogoServicios(await catRes.json())
      setError(null)
    } catch (err: any) {
      console.error(err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterOrdenId])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearch(val)
    fetchData(val)
  }

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedServicio(null)
    setIdServicio(catalogoServicios[0]?.id_servicio?.toString() || '')
    setCantidad(1)
    setPrecioUnitario(catalogoServicios[0]?.precio_base || 0)
    setObservaciones('')
    setOrdenId(filterOrdenId || ordenes[0]?.id_orden.toString() || '')
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (srv: ServicioRealizado) => {
    setModalMode('edit')
    setSelectedServicio(srv)
    setIdServicio(srv.id_servicio.toString())
    setCantidad(srv.cantidad)
    setPrecioUnitario(srv.precio_unitario)
    setObservaciones(srv.observaciones || '')
    setOrdenId(srv.id_orden.toString())
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleCatalogServiceChange = (id: string) => {
     setIdServicio(id)
     const srv = catalogoServicios.find(s => s.id_servicio === parseInt(id, 10))
     if (srv) setPrecioUnitario(srv.precio_base)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!idServicio || !ordenId) {
      setFormError('Debe seleccionar un servicio y una orden')
      return
    }

    try {
      setFormSubmitting(true)
      setFormError(null)

      const url = modalMode === 'create' ? '/api/servicios-realizados' : `/api/servicios-realizados/${selectedServicio?.id_orden_servicio}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_servicio: parseInt(idServicio, 10),
          id_orden: parseInt(ordenId, 10),
          cantidad: Number(cantidad),
          precio_unitario: Number(precioUnitario),
          observaciones
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.details || data.error || 'Ocurrió un error')
      }

      setIsModalOpen(false)
      fetchData(search)
    } catch (err: any) {
      console.error(err)
      setFormError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro?')) return
    try {
      const res = await fetch(`/api/servicios-realizados/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      fetchData(search)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const clearFilter = () => {
    router.push('/servicios-realizados')
  }

  const totalCosto = servicios.reduce((sum, s) => sum + Number(s.subtotal), 0)

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {filterOrdenId && (
              <button onClick={clearFilter} className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /></button>
            )}
            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Servicios Aplicados</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Control de trabajos y costos por orden</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg transition-all"
        >
          <Plus className="h-4.5 w-4.5" /> Registrar Trabajo
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 max-w-2xl">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><DollarSign className="h-5 w-5" /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Costo Total</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">${totalCosto.toFixed(2)}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><ClipboardList className="h-5 w-5" /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Trabajos Realizados</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{servicios.length}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          <p className="text-xs text-slate-400">Cargando...</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6">Orden / Vehículo</th>
                  <th className="py-3 px-6">Servicio</th>
                  <th className="py-3 px-6">Subtotal</th>
                  <th className="py-3 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {servicios.map((srv) => (
                  <tr key={srv.id_orden_servicio} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">Orden #{srv.id_orden}</p>
                        <p className="text-[10px] text-indigo-500 font-semibold">{srv.orden.vehiculo.placa} ({srv.orden.vehiculo.cliente.usuario.nombre})</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-700 dark:text-slate-200">{srv.servicio.nombre_servicio}</p>
                      <p className="text-[10px] text-slate-400 italic line-clamp-1">{srv.observaciones}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-emerald-500">${Number(srv.subtotal).toFixed(2)}</span>
                      <p className="text-[9px] text-slate-400">{srv.cantidad} x ${Number(srv.precio_unitario).toFixed(2)}</p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEditModal(srv)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 transition-all cursor-pointer"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(srv.id_orden_servicio)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-all cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                {modalMode === 'create' ? 'Registrar Trabajo Realizado' : 'Editar Detalle de Servicio'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Orden de Trabajo</label>
                <select value={ordenId} onChange={(e) => setOrdenId(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm">
                   {ordenes.map(o => (
                      <option key={o.id_orden} value={o.id_orden}>Orden #{o.id_orden} - {o.vehiculo.placa} ({o.vehiculo.cliente.usuario.nombre})</option>
                   ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Servicio Realizado</label>
                <select value={idServicio} onChange={(e) => handleCatalogServiceChange(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm">
                   {catalogoServicios.map(s => (
                      <option key={s.id_servicio} value={s.id_servicio}>{s.nombre_servicio} (Base: ${Number(s.precio_base).toFixed(2)})</option>
                   ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Cantidad</label>
                  <input type="number" required min="1" value={cantidad} onChange={(e) => setCantidad(parseInt(e.target.value, 10))} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Precio Unitario ($)</label>
                  <input type="number" required step="0.01" value={precioUnitario} onChange={(e) => setPrecioUnitario(parseFloat(e.target.value))} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm"/>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Observaciones Específicas</label>
                <textarea rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm resize-none" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold">Cancelar</button>
                <button type="submit" disabled={formSubmitting} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm disabled:opacity-50">
                  {modalMode === 'create' ? 'Guardar' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ServiciosRealizadosPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Cargando...</div>}>
      <ServiciosRealizadosContent />
    </Suspense>
  )
}
