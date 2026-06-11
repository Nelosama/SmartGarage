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

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedServicio, setSelectedServicio] = useState<ServicioRealizado | null>(null)

  const [idServicio, setIdServicio] = useState<string>('')
  const [ordenId, setOrdenId] = useState<string>('')
  const [cantidad, setCantidad] = useState<number>(1)
  const [precioUnitario, setPrecioUnitario] = useState<number>(0)
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
    fetchData()
  }, [filterOrdenId])

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedServicio(null)
    setIdServicio(catalogoServicios[0]?.id_servicio?.toString() || '')
    setCantidad(1)
    setPrecioUnitario(catalogoServicios[0]?.precio_base || 0)
    setObservaciones('')
    setOrdenId(filterOrdenId || ordenes[0]?.id_orden.toString() || '')
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
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setFormSubmitting(true)
      const url = modalMode === 'create' ? '/api/servicios-realizados' : `/api/servicios-realizados/${selectedServicio?.id_orden_servicio}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_servicio: parseInt(idServicio),
          id_orden: parseInt(ordenId),
          cantidad: Number(cantidad),
          precio_unitario: Number(precioUnitario),
          observaciones
        })
      })
      if (!res.ok) throw new Error('Error')
      setIsModalOpen(false)
      fetchData(search)
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormSubmitting(false)
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
          <p className="text-slate-500 text-sm">Registro de trabajos y facturación parcial.</p>
        </div>
        <button onClick={openCreateModal} className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 active:scale-95 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Registrar Trabajo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><DollarSign className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Costo Total Acumulado</p>
            <p className="text-2xl font-black text-slate-800">L {totalCosto.toFixed(2)}</p>
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
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Cargando...</td></tr>
              ) : (
                servicios.map(srv => (
                  <tr key={srv.id_orden_servicio} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">Orden #{srv.id_orden}</p>
                      <p className="text-xs text-slate-500">{srv.orden.vehiculo.placa} ({srv.orden.vehiculo.cliente.usuario.nombre})</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{srv.servicio.nombre_servicio}</p>
                      <p className="text-xs text-slate-400">{srv.observaciones}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-orange-600">L {Number(srv.subtotal).toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400">{srv.cantidad} x L {Number(srv.precio_unitario).toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(srv)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"><Edit2 className="h-4 w-4" /></button>
                        <button className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">Registrar Servicio</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Orden</label>
                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={ordenId} onChange={e => setOrdenId(e.target.value)}>
                  {ordenes.map(o => <option key={o.id_orden} value={o.id_orden}>Orden #{o.id_orden} - {o.vehiculo.placa}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Servicio</label>
                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={idServicio} onChange={e => setIdServicio(e.target.value)}>
                  {catalogoServicios.map(s => <option key={s.id_servicio} value={s.id_servicio}>{s.nombre_servicio}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cantidad</label>
                  <input type="number" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={cantidad} onChange={e => setCantidad(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio</label>
                  <input type="number" step="0.01" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={precioUnitario} onChange={e => setPrecioUnitario(Number(e.target.value))} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Cancelar</button>
                <button type="submit" disabled={formSubmitting} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20">{formSubmitting ? 'Guardando...' : 'Guardar'}</button>
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
