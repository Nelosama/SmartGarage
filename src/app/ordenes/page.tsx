'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  Wrench,
  Car,
  Calendar,
  AlertCircle,
  X,
  FileText,
  Play,
  CheckCircle,
  Eye,
  User,
  Activity,
  ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'

interface Vehiculo {
  id_vehiculo: number
  placa: string
  marca: string
  modelo: string
  id_cliente: number
  cliente: {
    usuario: {
      nombre: string
    }
  }
}

interface Mecanico {
  id_mecanico: number
  especialidad: string
  usuario: {
    nombre: string
  }
}

interface Estado {
  id_estado: number
  nombre_estado: string
}

interface Orden {
  id_orden: number
  id_cliente: number
  id_vehiculo: number
  id_mecanico?: number
  id_estado_actual: number
  fecha_ingreso: string
  fecha_estimada_entrega?: string
  fecha_entrega?: string
  kilometraje_ingreso: number
  motivo_ingreso: string
  prioridad: string
  observaciones?: string
  vehiculo: Vehiculo
  estado_actual: Estado
  mecanico?: Mecanico
}

export default function OrdenesPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'todos' | 'Pendiente' | 'En progreso' | 'Completado'>('todos')
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null)
  
  // Form states
  const [motivo, setMotivo] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [estadoId, setEstadoId] = useState<string>('')
  const [mecanicoId, setMecanicoId] = useState<string>('')
  const [vehiculoId, setVehiculoId] = useState<string>('')
  const [prioridad, setPrioridad] = useState('Media')
  const [kilometraje, setKilometraje] = useState<number>(0)
  const [fechaIngreso, setFechaIngreso] = useState('')
  const [fechaEstimada, setFechaEstimada] = useState('')

  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch only order data
  const fetchOrders = React.useCallback(async (query = '') => {
    try {
      setLoading(true)
      const ordURL = `/api/ordenes${query ? `?q=${encodeURIComponent(query)}` : ''}`
      const ordRes = await fetch(ordURL)

      if (!ordRes.ok) {
         const errData = await ordRes.json()
         throw new Error(errData.details || errData.error || 'Error en servidor')
      }

      setOrdenes(await ordRes.json())
      setError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(err)
      setError(`Error: ${message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch metadata once on mount
  const fetchMetadata = React.useCallback(async () => {
    try {
      const [vehRes, mecRes, estRes] = await Promise.all([
        fetch('/api/vehiculos'),
        fetch('/api/mecanicos'),
        fetch('/api/estados_orden')
      ])

      if (!vehRes.ok || !mecRes.ok || !estRes.ok) {
        throw new Error('Error al cargar metadatos')
      }

      setVehiculos(await vehRes.json())
      setMecanicos(await mecRes.json())
      setEstados(await estRes.json())
    } catch (err: unknown) {
      console.error('Metadata fetch error:', err)
    }
  }, [])

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (mounted) {
        await fetchMetadata()
        await fetchOrders() // Immediate fetch on mount
      }
    })();
    return () => {
      mounted = false
    }
  }, [fetchMetadata, fetchOrders])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchOrders(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchOrders])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedOrden(null)
    setMotivo('')
    setObservaciones('')
    setEstadoId(estados.find(e => e.nombre_estado === 'Pendiente')?.id_estado?.toString() || estados[0]?.id_estado?.toString() || '')
    setMecanicoId('')
    setVehiculoId(vehiculos[0]?.id_vehiculo?.toString() || '')
    setPrioridad('Media')
    setKilometraje(0)
    setFechaIngreso(new Date().toISOString().split('T')[0])
    setFechaEstimada('')
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (orden: Orden) => {
    setModalMode('edit')
    setSelectedOrden(orden)
    setMotivo(orden.motivo_ingreso)
    setObservaciones(orden.observaciones || '')
    setEstadoId(orden.id_estado_actual.toString())
    setMecanicoId(orden.id_mecanico?.toString() || '')
    setVehiculoId(orden.id_vehiculo.toString())
    setPrioridad(orden.prioridad)
    setKilometraje(orden.kilometraje_ingreso)
    setFechaIngreso(new Date(orden.fecha_ingreso).toISOString().split('T')[0])
    setFechaEstimada(orden.fecha_estimada_entrega ? new Date(orden.fecha_estimada_entrega).toISOString().split('T')[0] : '')
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!motivo || !vehiculoId || !estadoId) {
      setFormError('Motivo, Vehículo y Estado son requeridos')
      return
    }

    try {
      setFormSubmitting(true)
      setFormError(null)

      const url = modalMode === 'create' ? '/api/ordenes' : `/api/ordenes/${selectedOrden?.id_orden}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'

      const selectedVeh = vehiculos.find(v => v.id_vehiculo === parseInt(vehiculoId, 10))

      const body = {
        motivo_ingreso: motivo,
        observaciones,
        id_estado_actual: parseInt(estadoId, 10),
        id_mecanico: mecanicoId ? parseInt(mecanicoId, 10) : null,
        id_vehiculo: parseInt(vehiculoId, 10),
        id_cliente: selectedVeh?.id_cliente,
        prioridad,
        kilometraje_ingreso: parseInt(kilometraje.toString(), 10),
        fecha_ingreso: new Date(fechaIngreso).toISOString(),
        fecha_estimada_entrega: fechaEstimada ? new Date(fechaEstimada).toISOString() : null
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.details || data.error || 'Error al guardar orden')
      }

      setIsModalOpen(false)
      void fetchOrders(search)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(err)
      setFormError(message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro?')) return
    try {
      const res = await fetch(`/api/ordenes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      void fetchOrders(search)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      alert(message)
    }
  }

  const filteredOrdenes = useMemo(() => {
    return ordenes.filter(o => {
      if (activeTab === 'todos') return true
      return o.estado_actual.nombre_estado === activeTab
    })
  }, [ordenes, activeTab])

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Órdenes de Trabajo</h2>
          <p className="text-xs text-slate-400 mt-0.5">Control de diagnóstico y reparaciones</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg transition-all"
        >
          <Plus className="h-4.5 w-4.5" /> Nueva Orden
        </button>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-900 self-start">
          {(['todos', 'Pendiente', 'En progreso', 'Completado'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                activeTab === tab ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500'
              }`}
            >
              {tab === 'todos' ? 'Todas' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar orden..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
          <p className="text-xs text-slate-400">Cargando órdenes...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrdenes.map((orden) => (
            <div key={orden.id_orden} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                   <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      orden.estado_actual.nombre_estado === 'Completado' ? 'bg-emerald-50 text-emerald-600' :
                      orden.estado_actual.nombre_estado === 'En progreso' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                   }`}>
                      {orden.estado_actual.nombre_estado}
                   </span>
                   <span className="text-[10px] text-slate-400 font-mono">#{orden.id_orden}</span>
                </div>

                <div>
                   <h4 className="font-extrabold text-slate-800 dark:text-slate-100 line-clamp-1">{orden.motivo_ingreso}</h4>
                   <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Car className="h-3 w-3" /> {orden.vehiculo.marca} {orden.vehiculo.modelo} ({orden.vehiculo.placa})
                   </div>
                   <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                      <User className="h-3 w-3" /> Cliente: {orden.vehiculo.cliente.usuario.nombre}
                   </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs border border-slate-100 dark:border-slate-800">
                   <p className="text-slate-600 dark:text-slate-400 italic line-clamp-2">{orden.observaciones || 'Sin observaciones adicionales'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                   <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase">
                      <Activity className="h-3 w-3" /> Prioridad: {orden.prioridad}
                   </div>
                   <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase justify-end">
                      {orden.kilometraje_ingreso.toLocaleString()} KM
                   </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                   <Calendar className="h-3.5 w-3.5" /> {new Date(orden.fecha_ingreso).toLocaleDateString()}
                </div>
                <div className="flex gap-1">
                   <Link href={`/servicios-realizados?ordenId=${orden.id_orden}`} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600">
                      <Eye className="h-4 w-4" />
                   </Link>
                   <button onClick={() => openEditModal(orden)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600">
                      <Edit2 className="h-4 w-4" />
                   </button>
                   <button onClick={() => handleDelete(orden.id_orden)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                {modalMode === 'create' ? 'Nueva Orden de Trabajo' : 'Editar Orden de Trabajo'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Motivo de Ingreso</label>
                <input type="text" required value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm"/>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Vehículo</label>
                <select value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm">
                   {vehiculos.map(v => (
                      <option key={v.id_vehiculo} value={v.id_vehiculo}>{v.marca} {v.modelo} ({v.placa}) - {v.cliente.usuario.nombre}</option>
                   ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Estado</label>
                    <select value={estadoId} onChange={(e) => setEstadoId(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm">
                       {estados.map(e => (
                          <option key={e.id_estado} value={e.id_estado}>{e.nombre_estado}</option>
                       ))}
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Prioridad</label>
                    <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm">
                       <option value="Baja">Baja</option>
                       <option value="Media">Media</option>
                       <option value="Alta">Alta</option>
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Kilometraje</label>
                    <input type="number" required value={kilometraje} onChange={(e) => setKilometraje(parseInt(e.target.value, 10))} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm"/>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Fecha Ingreso</label>
                    <input type="date" required value={fechaIngreso} onChange={(e) => setFechaIngreso(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm"/>
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-500 uppercase">Mecánico Asignado</label>
                 <select value={mecanicoId} onChange={(e) => setMecanicoId(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm">
                    <option value="">Sin asignar</option>
                    {mecanicos.map(m => (
                       <option key={m.id_mecanico} value={m.id_mecanico}>{m.usuario.nombre} - {m.especialidad}</option>
                    ))}
                 </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Observaciones / Diagnóstico Inicial</label>
                <textarea rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm resize-none" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-900 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold">Cancelar</button>
                <button type="submit" disabled={formSubmitting} className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-sm disabled:opacity-50">
                  {modalMode === 'create' ? 'Crear Orden' : 'Actualizar Orden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
