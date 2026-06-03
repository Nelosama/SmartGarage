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
    nombre: string
  }
}

interface Orden {
  id: number
  servicio: string
  estado: string
  vehiculo: Vehiculo
}

interface ServicioRealizado {
  id: number
  descripcion: string
  repuesto: string
  costo: number
  ordenId: number
  orden: Orden
}

function ServiciosRealizadosContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const filterOrdenId = searchParams.get('ordenId')

  const [servicios, setServicios] = useState<ServicioRealizado[]>([])
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedServicio, setSelectedServicio] = useState<ServicioRealizado | null>(null)

  // Form states
  const [descripcion, setDescripcion] = useState('')
  const [repuesto, setRepuesto] = useState('')
  const [costo, setCosto] = useState<string>('0')
  const [ordenId, setOrdenId] = useState<string>('')
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

      if (!servRes.ok || !ordRes.ok) throw new Error('Error al conectar con el servidor')

      const servData = await servRes.json()
      const ordData = await ordRes.json()

      setServicios(servData)
      setOrdenes(ordData)
      setError(null)
    } catch (err: any) {
      console.error(err)
      setError('No se pudieron cargar los servicios realizados de la base de datos local. Usando datos demo.')
      
      // Fallback demo data
      setOrdenes([
        { 
          id: 1, 
          servicio: 'Alineación y Balanceo', 
          estado: 'En progreso',
          vehiculo: { placa: 'MEC-1234', marca: 'Toyota', modelo: 'Hilux', cliente: { nombre: 'Juan Pérez' } }
        },
        { 
          id: 2, 
          servicio: 'Cambio de Aceite y Filtros', 
          estado: 'Pendiente',
          vehiculo: { placa: 'ABC-7890', marca: 'Honda', modelo: 'Civic', cliente: { nombre: 'María Rodríguez' } }
        },
        { 
          id: 3, 
          servicio: 'Frenos y Rectificación de Discos', 
          estado: 'Completado',
          vehiculo: { placa: 'XYZ-5544', marca: 'Ford', modelo: 'Ranger', cliente: { nombre: 'Carlos Mendoza' } }
        }
      ])

      const demoServicios: ServicioRealizado[] = [
        {
          id: 1,
          descripcion: 'Alineado computarizado',
          repuesto: 'Ninguno',
          costo: 45.00,
          ordenId: 1,
          orden: { 
            id: 1, 
            servicio: 'Alineación y Balanceo', 
            estado: 'En progreso',
            vehiculo: { placa: 'MEC-1234', marca: 'Toyota', modelo: 'Hilux', cliente: { nombre: 'Juan Pérez' } }
          }
        },
        {
          id: 2,
          descripcion: 'Cambio de balatas delanteras',
          repuesto: 'Balatas Cerámicas',
          costo: 120.00,
          ordenId: 3,
          orden: { 
            id: 3, 
            servicio: 'Frenos y Rectificación de Discos', 
            estado: 'Completado',
            vehiculo: { placa: 'XYZ-5544', marca: 'Ford', modelo: 'Ranger', cliente: { nombre: 'Carlos Mendoza' } }
          }
        },
        {
          id: 3,
          descripcion: 'Rectificación de discos de freno',
          repuesto: 'Ninguno',
          costo: 60.00,
          ordenId: 3,
          orden: { 
            id: 3, 
            servicio: 'Frenos y Rectificación de Discos', 
            estado: 'Completado',
            vehiculo: { placa: 'XYZ-5544', marca: 'Ford', modelo: 'Ranger', cliente: { nombre: 'Carlos Mendoza' } }
          }
        }
      ]

      if (filterOrdenId) {
        setServicios(demoServicios.filter(s => s.ordenId === parseInt(filterOrdenId, 10)))
      } else {
        setServicios(demoServicios)
      }
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
    setDescripcion('')
    setRepuesto('')
    setCosto('0')
    setOrdenId(filterOrdenId || ordenes[0]?.id.toString() || '')
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (servicio: ServicioRealizado) => {
    setModalMode('edit')
    setSelectedServicio(servicio)
    setDescripcion(servicio.descripcion)
    setRepuesto(servicio.repuesto)
    setCosto(servicio.costo.toString())
    setOrdenId(servicio.ordenId.toString())
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descripcion || repuesto === undefined || !costo || !ordenId) {
      setFormError('Todos los campos son obligatorios')
      return
    }

    try {
      setFormSubmitting(true)
      setFormError(null)

      const url = modalMode === 'create' ? '/api/servicios-realizados' : `/api/servicios-realizados/${selectedServicio?.id}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion,
          repuesto,
          costo: parseFloat(costo),
          ordenId: parseInt(ordenId, 10)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al guardar el servicio realizado')
      }

      setIsModalOpen(false)
      fetchData(search)
    } catch (err: any) {
      console.error(err)
      setFormError(err.message || 'Error en la conexión. Guardado simulado en modo demo.')

      // Simulate client side update in demo mode
      const selectedOrdObj = ordenes.find(o => o.id === parseInt(ordenId, 10)) || {
        id: 1,
        servicio: 'Alineación y Balanceo',
        estado: 'En progreso',
        vehiculo: { placa: 'MEC-1234', marca: 'Toyota', modelo: 'Hilux', cliente: { nombre: 'Juan Pérez' } }
      }

      if (modalMode === 'create') {
        const mockNew: ServicioRealizado = {
          id: Date.now(),
          descripcion,
          repuesto,
          costo: parseFloat(costo),
          ordenId: parseInt(ordenId, 10),
          orden: selectedOrdObj
        }
        setServicios(prev => [mockNew, ...prev])
        setIsModalOpen(false)
      } else if (modalMode === 'edit' && selectedServicio) {
        setServicios(prev => prev.map(s => s.id === selectedServicio.id ? {
          ...s,
          descripcion,
          repuesto,
          costo: parseFloat(costo),
          ordenId: parseInt(ordenId, 10),
          orden: selectedOrdObj
        } : s))
        setIsModalOpen(false)
      }
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro de servicio realizado?')) return

    try {
      const res = await fetch(`/api/servicios-realizados/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar el servicio')
      }

      fetchData(search)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Error al eliminar. Simulado en modo demo.')
      setServicios(prev => prev.filter(s => s.id !== id))
    }
  }

  const clearFilter = () => {
    router.push('/servicios-realizados')
  }

  const totalCosto = servicios.reduce((sum, s) => sum + s.costo, 0)
  const totalRepuestos = servicios.filter(s => s.repuesto && s.repuesto !== 'Ninguno' && s.repuesto !== '').length

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
            <h2 className="text-2xl font-black tracking-tight">Servicios y Repuestos Aplicados</h2>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {filterOrdenId 
              ? `Visualizando los costos y repuestos detallados para la Orden de Trabajo #${filterOrdenId}`
              : 'Detalle de trabajos realizados, repuestos instalados e importes cobrados'
            }
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Registrar Servicio
        </button>
      </div>

      {/* Stats summary cards */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 max-w-3xl">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Costo Acumulado</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">${totalCosto.toFixed(2)}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Repuestos Instalados</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{totalRepuestos} piezas</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-4 shadow-sm sm:col-span-2 md:col-span-1">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Servicios Ejecutados</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{servicios.length} trabajos</p>
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
              placeholder="Buscar por descripción o repuesto..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:focus:ring-blue-400/25 text-sm transition-all shadow-sm"
            />
          </div>
          {filterOrdenId && (
            <button
              onClick={clearFilter}
              className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2.5 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              Quitar filtro: Orden #{filterOrdenId} <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Performed Services Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-400 dark:text-slate-500">Cargando detalles de servicios...</p>
          </div>
        ) : servicios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 dark:text-slate-600 mb-4">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-700 dark:text-slate-300">No hay servicios registrados</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
              {search ? 'Intenta modificar el término de búsqueda' : 'Registra el primer servicio realizado para asignarle costos a la orden'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6">Orden de Trabajo / Vehículo</th>
                  <th className="py-3 px-6">Descripción del Trabajo</th>
                  <th className="py-3 px-6">Repuesto Utilizado</th>
                  <th className="py-3 px-6">Costo</th>
                  <th className="py-3 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {servicios.map((srv) => (
                  <tr key={srv.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">Orden #{srv.ordenId}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">{srv.orden.servicio}</p>
                        <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold">
                          Placa: {srv.orden.vehiculo.placa} ({srv.orden.vehiculo.cliente.nombre})
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-slate-700 dark:text-slate-200">{srv.descripcion}</p>
                    </td>
                    <td className="py-4 px-6">
                      {srv.repuesto && srv.repuesto !== 'Ninguno' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <Package className="h-3 w-3 text-slate-400" />
                          {srv.repuesto}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin repuesto</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-emerald-500">${srv.costo.toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(srv)}
                          className="p-2 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/20 transition-all cursor-pointer"
                          title="Editar servicio"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(srv.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                          title="Eliminar servicio"
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

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-2xl p-6 space-y-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                  {modalMode === 'create' ? 'Registrar Servicio Realizado' : 'Editar Detalle de Servicio'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Registra el trabajo técnico ejecutado y los costos de refacciones
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error alerts inside form */}
            {formError && (
              <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/40 dark:border-red-900/30">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Orden de Trabajo Vinculada
                </label>
                {ordenes.length === 0 ? (
                  <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-xl border border-red-200/40">
                    No hay órdenes de trabajo en el sistema. Abre una orden antes de cargar servicios.
                  </div>
                ) : (
                  <select
                    value={ordenId}
                    onChange={(e) => setOrdenId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:focus:ring-emerald-400/25 text-sm transition-all"
                  >
                    {ordenes.map((o) => (
                      <option key={o.id} value={o.id}>
                        Orden #{o.id}: {o.servicio} (Placa: {o.vehiculo.placa} - {o.vehiculo.cliente.nombre})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Descripción del Trabajo Realizado
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Rectificación de tambores y cambio de balatas traseras"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:focus:ring-emerald-400/25 text-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Repuesto Utilizado (Si aplica)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Balatas de tambor Brembo"
                    value={repuesto}
                    onChange={(e) => setRepuesto(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:focus:ring-emerald-400/25 text-sm transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Costo Total ($ USD / MXN)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    placeholder="Ej. 125.50"
                    value={costo}
                    onChange={(e) => setCosto(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:focus:ring-emerald-400/25 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || ordenes.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {modalMode === 'create' ? 'Guardar Registro' : 'Actualizar Registro'}
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
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
        <p className="text-xs text-slate-400 dark:text-slate-500">Cargando...</p>
      </div>
    }>
      <ServiciosRealizadosContent />
    </Suspense>
  )
}
