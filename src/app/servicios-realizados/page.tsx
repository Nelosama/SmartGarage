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

  // Fetch performed services and orders
  const fetchData = async (query = '') => {
    try {
      setLoading(true)
      const servURL = `/api/servicios-realizados${filterOrdenId ? `?ordenId=${filterOrdenId}` : ''}${query ? `${filterOrdenId ? '&' : '?'}q=${encodeURIComponent(query)}` : ''}`
      
      const [servRes, ordRes] = await Promise.all([
        fetch(servURL),
        fetch('/api/ordenes')
      ])

      if (!servRes.ok || !ordRes.ok) {
        const errData = await servRes.json()
        throw new Error(errData.details || errData.error || 'Error al conectar con el servidor')
      }

      const servData = await servRes.json()
      const ordData = await ordRes.json()

      setServicios(servData)
      setOrdenes(ordData)
      setError(null)
    } catch (err: any) {
      console.error(err)
      setError(`Error de base de datos: ${err.message}. Verifique su conexión en .env`)
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
    setIdServicio('')
    setCantidad(1)
    setPrecioUnitario(0)
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
          cantidad,
          precio_unitario: precioUnitario,
          observaciones
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.details || data.error || 'Ocurrió un error al guardar el servicio realizado')
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
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return

    try {
      const res = await fetch(`/api/servicios-realizados/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.details || data.error || 'Error al eliminar el servicio')
      }

      fetchData(search)
    } catch (err: any) {
      console.error(err)
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
              <button 
                onClick={clearFilter}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Quitar filtro de orden"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h2 className="text-2xl font-black tracking-tight">Servicios Realizados</h2>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {filterOrdenId 
              ? `Visualizando servicios aplicados para la Orden de Trabajo #${filterOrdenId}`
              : 'Detalle de trabajos realizados e importes cobrados'
            }
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Registrar Trabajo
        </button>
      </div>

      {/* Stats summary cards */}
      <div className="grid gap-6 sm:grid-cols-2 max-w-2xl">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Costo Total</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">${totalCosto.toFixed(2)}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Trabajos Listados</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{servicios.length}</p>
          </div>
        </div>
      </div>

      {/* Search and warnings */}
      <div className="flex flex-col gap-4">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/35 dark:border-amber-900/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Buscar servicio u observaciones..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:focus:ring-blue-400/25 text-sm transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Performed Services Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-400 dark:text-slate-500">Cargando...</p>
          </div>
        ) : (servicios.length === 0 && !loading) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 dark:text-slate-600 mb-4">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-700 dark:text-slate-300">No hay servicios registrados</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
              {search ? 'No se encontraron resultados' : 'Registra el primer servicio realizado para esta orden'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6">Orden / Vehículo</th>
                  <th className="py-3 px-6">Servicio</th>
                  <th className="py-3 px-6">Detalles</th>
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
                        <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold">
                          Placa: {srv.orden.vehiculo.placa} ({srv.orden.vehiculo.cliente.usuario.nombre})
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-700 dark:text-slate-200">{srv.servicio.nombre_servicio}</p>
                      <p className="text-[10px] text-slate-400">{srv.observaciones}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {srv.cantidad} x ${Number(srv.precio_unitario).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-emerald-500">${Number(srv.subtotal).toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(srv)}
                          className="p-2 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/20 transition-all cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(srv.id_orden_servicio)}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL SIMPLIFICADO PARA ESTE EJEMPLO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">{modalMode === 'create' ? 'Registrar Trabajo' : 'Editar Trabajo'}</h3>
                <button onClick={() => setIsModalOpen(false)}><X/></button>
             </div>
             <p className="text-sm text-slate-500">
                La base de datos requiere IDs válidos de la tabla servicios y ordenes.
             </p>
             <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form fields here would ideally be populated from catalogs */}
                <div className="flex justify-end gap-3">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-xl">Cancelar</button>
                   <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl">Guardar</button>
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
