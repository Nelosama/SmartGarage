'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ClipboardList,
  DollarSign,
  X,
  Wrench
} from 'lucide-react'
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
interface CatalogoServicio {
  id_servicio: number
  nombre_servicio: string
  descripcion?: string
  precio_base: number
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
interface ServicioItem {
  id_servicio: string
  cantidad: number
  precio_unitario: number
}
function ServiciosRealizadosContent() {
  const searchParams = useSearchParams()
  const filterOrdenId = searchParams.get('ordenId')
  const [servicios, setServicios] = useState<ServicioRealizado[]>([])
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [catalogoServicios, setCatalogoServicios] = useState<CatalogoServicio[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedServicio, setSelectedServicio] = useState<ServicioRealizado | null>(null)
  const [ordenId, setOrdenId] = useState<string>('')
  const [items, setItems] = useState<ServicioItem[]>([])
  const [observaciones, setObservaciones] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
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
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchData(search)
  }, [filterOrdenId])
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])
  const getPrecioServicio = (idServicio: string) => {
    const servicio = catalogoServicios.find(s => s.id_servicio === Number(idServicio))
    return Number(servicio?.precio_base || 0)
  }
  const createDefaultItem = (excludeIds: string[] = []): ServicioItem => {
    const firstAvailable =
      catalogoServicios.find(s => !excludeIds.includes(s.id_servicio.toString())) ||
      catalogoServicios[0]
    return {
      id_servicio: firstAvailable?.id_servicio?.toString() || '',
      cantidad: 1,
      precio_unitario: Number(firstAvailable?.precio_base || 0)
    }
  }
  const openCreateModal = () => {
    setModalMode('create')
    setSelectedServicio(null)
    setOrdenId(filterOrdenId || ordenes[0]?.id_orden?.toString() || '')
    setItems([createDefaultItem()])
    setObservaciones('')
    setFormError(null)
    setIsModalOpen(true)
  }
  const openEditModal = (srv: ServicioRealizado) => {
    setModalMode('edit')
    setSelectedServicio(srv)
    setOrdenId(srv.id_orden.toString())
    setItems([
      {
        id_servicio: srv.id_servicio.toString(),
        cantidad: Number(srv.cantidad),
        precio_unitario: Number(srv.precio_unitario)
      }
    ])
    setObservaciones(srv.observaciones || '')
    setFormError(null)
    setIsModalOpen(true)
  }
  const addItem = () => {
    setItems(prev => {
      const usedIds = prev.map(item => item.id_servicio)
      return [...prev, createDefaultItem(usedIds)]
    })
  }
  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }
  const updateItem = (index: number, field: keyof ServicioItem, value: string | number) => {
    setItems(prev => {
      const updated = [...prev]
      const current = { ...updated[index] }
      if (field === 'id_servicio') {
        current.id_servicio = String(value)
        current.precio_unitario = getPrecioServicio(String(value))
      }
      if (field === 'cantidad') {
        current.cantidad = Number(value)
      }
      if (field === 'precio_unitario') {
        current.precio_unitario = Number(value)
      }
      updated[index] = current
      return updated
    })
  }
  const subtotalServicios = items.reduce(
    (sum, item) => sum + Number(item.cantidad || 0) * Number(item.precio_unitario || 0),
    0
  )
  const impuesto = subtotalServicios * 0.15
  const totalFactura = subtotalServicios + impuesto
  const selectedOrdenData = ordenes.find(o => o.id_orden === Number(ordenId))
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setFormSubmitting(true)
      setFormError(null)
      if (!ordenId) {
        throw new Error('Debes seleccionar una orden')
      }
      if (items.length === 0) {
        throw new Error('Debes agregar al menos un servicio')
      }
      const invalidItem = items.find(
        item => !item.id_servicio || Number(item.cantidad) <= 0 || Number(item.precio_unitario) < 0
      )
      if (invalidItem) {
        throw new Error('Revisa los servicios, cantidades y precios')
      }
      const serviceIds = items.map(item => item.id_servicio)
      const hasDuplicates = new Set(serviceIds).size !== serviceIds.length
      if (hasDuplicates) {
        throw new Error('No repitas el mismo servicio. Usa la cantidad si necesitas cobrar más de una vez.')
      }
      const shouldUseBulkSave = modalMode === 'create' || items.length > 1
      const url = shouldUseBulkSave
        ? '/api/servicios-realizados'
        : `/api/servicios-realizados/${selectedServicio?.id_orden_servicio}`
      const method = shouldUseBulkSave ? 'POST' : 'PUT'
      const body = shouldUseBulkSave
        ? {
            id_orden: Number(ordenId),
            items: items.map(item => ({
              id_servicio: Number(item.id_servicio),
              cantidad: Number(item.cantidad),
              precio_unitario: Number(item.precio_unitario)
            })),
            observaciones
          }
        : {
            id_servicio: Number(items[0].id_servicio),
            id_orden: Number(ordenId),
            cantidad: Number(items[0].cantidad),
            precio_unitario: Number(items[0].precio_unitario),
            observaciones
          }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.details || data?.error || 'Error al guardar')
      }
      setIsModalOpen(false)
      fetchData(search)
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }
  const handleDelete = async (id: number) => {
    const confirmDelete = confirm('¿Seguro que deseas eliminar este servicio realizado?')
    if (!confirmDelete) return
    try {
      const res = await fetch(`/api/servicios-realizados/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Error al eliminar')
      fetchData(search)
    } catch (err: any) {
      setError(err.message)
    }
  }
  const totalCosto = servicios.reduce((sum, s) => sum + Number(s.subtotal), 0)
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-orange-600" />
            Servicios Realizados
          </h1>
          <p className="text-slate-500 text-sm">Registro de trabajos y generación automática de factura.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 active:scale-95 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Registrar Trabajo
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Costo Total Acumulado</p>
            <p className="text-2xl font-black text-slate-800">L {totalCosto.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar servicio u observación..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="px-6 py-4">Orden / Vehículo</th>
                <th className="px-6 py-4">Servicio</th>
                <th className="px-6 py-4">Subtotal</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    Cargando...
                  </td>
                </tr>
              ) : servicios.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No hay servicios registrados.
                  </td>
                </tr>
              ) : (
                servicios.map(srv => (
                  <tr key={srv.id_orden_servicio} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">Orden #{srv.id_orden}</p>
                      <p className="text-xs text-slate-500">
                        {srv.orden.vehiculo.placa} ({srv.orden.vehiculo.cliente.usuario.nombre})
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{srv.servicio.nombre_servicio}</p>
                      <p className="text-xs text-slate-400">{srv.observaciones}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-orange-600">L {Number(srv.subtotal).toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400">
                        {srv.cantidad} x L {Number(srv.precio_unitario).toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(srv)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(srv.id_orden_servicio)}
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-scale-in my-6 max-h-[calc(100vh-3rem)] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-600" />
                {modalMode === 'create' ? 'Registrar Servicios' : 'Editar / Agregar Servicios'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Orden</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  value={ordenId}
                  onChange={e => setOrdenId(e.target.value)}
                  disabled={modalMode === 'edit'}
                >
                  {ordenes.map(o => (
                    <option key={o.id_orden} value={o.id_orden}>
                      Orden #{o.id_orden} - {o.vehiculo.placa}
                    </option>
                  ))}
                </select>
                {selectedOrdenData && (
                  <div className="mt-3 bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs">
                    <p className="font-bold text-slate-700">
                      Cliente: {selectedOrdenData.vehiculo.cliente.usuario.nombre}
                    </p>
                    <p className="text-slate-500 mt-1">
                      Vehículo: {selectedOrdenData.vehiculo.marca} {selectedOrdenData.vehiculo.modelo} - {selectedOrdenData.vehiculo.placa}
                    </p>
                    <p className="text-slate-500 mt-1">
                      Estado: {selectedOrdenData.estado_actual.nombre_estado}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 uppercase">Servicios</p>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Agregar servicio
                  </button>
                </div>
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end bg-slate-50 border border-slate-200 rounded-2xl p-3">
                    <div className="col-span-12 md:col-span-5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Servicio
                      </label>
                      <select
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                        value={item.id_servicio}
                        onChange={e => updateItem(index, 'id_servicio', e.target.value)}
                      >
                        {catalogoServicios.map(s => (
                          <option key={s.id_servicio} value={s.id_servicio}>
                            {s.nombre_servicio}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                        value={item.cantidad}
                        onChange={e => updateItem(index, 'cantidad', e.target.value)}
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Precio
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                        value={item.precio_unitario}
                        onChange={e => updateItem(index, 'precio_unitario', e.target.value)}
                      />
                    </div>
                    <div className="col-span-10 md:col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Subtotal</p>
                      <p className="text-sm font-black text-orange-600">
                        L {(Number(item.cantidad || 0) * Number(item.precio_unitario || 0)).toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-2 md:col-span-1 flex justify-end">
                      {((modalMode === 'create' && items.length > 1) || (modalMode === 'edit' && index > 0)) && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observaciones</label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[90px]"
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Observaciones generales del trabajo realizado..."
                />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-semibold">Subtotal servicios</span>
                  <span className="font-bold text-slate-800">L {subtotalServicios.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-semibold">ISV 15%</span>
                  <span className="font-bold text-slate-800">L {impuesto.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg border-t border-slate-200 pt-2">
                  <span className="font-black text-slate-800">Total estimado</span>
                  <span className="font-black text-orange-600">L {totalFactura.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Al guardar, se registrarán los servicios y se generará o actualizará la factura de la orden.
                </p>
              </div>
              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-slate-100 -mx-6 -mb-6 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 disabled:opacity-50"
                >
                  {formSubmitting
                    ? 'Guardando...'
                    : modalMode === 'create'
                      ? 'Guardar y generar factura'
                      : items.length > 1
                        ? 'Actualizar y agregar servicios'
                        : 'Actualizar servicio'}
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
    <Suspense fallback={<div className="p-20 text-center text-slate-400">Cargando aplicación...</div>}>
      <ServiciosRealizadosContent />
    </Suspense>
  )
}