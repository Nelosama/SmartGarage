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
import { useSession } from 'next-auth/react'

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
  const { data: session } = useSession()
  const user = session?.user as any
  const id_rol = user?.id_rol ? Number(user.id_rol) : null

  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'todos' | 'Recibido' | 'En reparación' | 'Listo para entrega'>('todos')
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

  const fetchOrders = React.useCallback(async (query = '') => {
    try {
      setLoading(true)
      const ordURL = `/api/ordenes${query ? `?q=${encodeURIComponent(query)}` : ''}`
      const ordRes = await fetch(ordURL)
      if (!ordRes.ok) throw new Error('Error en servidor')
      setOrdenes(await ordRes.json())
      setError(null)
    } catch (err: any) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMetadata = React.useCallback(async () => {
    try {
      const [vehRes, mecRes, estRes] = await Promise.all([
        fetch('/api/vehiculos'),
        fetch('/api/mecanicos'),
        fetch('/api/estados_orden')
      ])
      setVehiculos(await vehRes.json())
      setMecanicos(await mecRes.json())
      setEstados(await estRes.json())
    } catch (err) {
      console.error('Metadata fetch error:', err)
    }
  }, [])

  useEffect(() => {
    fetchMetadata()
    fetchOrders()
  }, [fetchMetadata, fetchOrders])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchOrders])

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedOrden(null)
    setMotivo('')
    setObservaciones('')
    setEstadoId(estados.find(e => e.nombre_estado === 'Recibido')?.id_estado?.toString() || estados[0]?.id_estado?.toString() || '')
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
    try {
      setFormSubmitting(true)
      const url = modalMode === 'create' ? '/api/ordenes' : `/api/ordenes/${selectedOrden?.id_orden}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'
      const selectedVeh = vehiculos.find(v => v.id_vehiculo === parseInt(vehiculoId))

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivo_ingreso: motivo,
          observaciones,
          id_estado_actual: parseInt(estadoId),
          id_mecanico: mecanicoId ? parseInt(mecanicoId) : null,
          id_vehiculo: parseInt(vehiculoId),
          id_cliente: selectedVeh?.id_cliente,
          prioridad,
          kilometraje_ingreso: parseInt(kilometraje.toString()),
          fecha_ingreso: new Date(fechaIngreso).toISOString(),
          fecha_estimada_entrega: fechaEstimada ? new Date(fechaEstimada).toISOString() : null
        })
      })

      if (!res.ok) throw new Error('Error al guardar')
      setIsModalOpen(false)
      fetchOrders(search)
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const filteredOrdenes = useMemo(() => {
    return ordenes.filter(o => {
      const status = o.estado_actual.nombre_estado
      if (activeTab === 'todos') return true
      if (activeTab === 'Recibido') return ['Recibido', 'En espera'].includes(status)
      if (activeTab === 'En reparación') return ['En diagnostico', 'En reparacion', 'Esperando repuestos', 'En prueba'].includes(status)
      if (activeTab === 'Listo para entrega') return status === 'Listo para entrega'
      return status === activeTab
    })
  }, [ordenes, activeTab])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Wrench className="h-8 w-8 text-orange-600" />
            Órdenes de Trabajo
          </h1>
          <p className="text-slate-500 text-sm">Control de diagnóstico y reparaciones en curso.</p>
        </div>
        {(id_rol === 1 || id_rol === 2) && (
          <button
            onClick={openCreateModal}
            className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Nueva Orden
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['todos', 'Recibido', 'En reparación', 'Listo para entrega'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'todos' ? 'Todas' : tab}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por placa, cliente o motivo..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Cargando órdenes...</div>
        ) : filteredOrdenes.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white border border-slate-200 rounded-2xl">No hay órdenes que coincidan.</div>
        ) : filteredOrdenes.map((o) => (
          <div key={o.id_orden} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-orange-200 transition-all group">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex gap-4 items-start">
                <div className="p-3 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                  <Car className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded tracking-wider">#{o.id_orden}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                      o.prioridad === 'Alta' ? 'bg-red-50 text-red-600 border-red-100' :
                      o.prioridad === 'Media' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {o.prioridad}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">{o.motivo_ingreso}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
                    <p className="text-sm text-slate-500">
                      {o.vehiculo.marca} {o.vehiculo.modelo} • <span className="font-mono font-bold text-slate-700">{o.vehiculo.placa}</span>
                    </p>
                    <div className="flex items-center gap-1.5 text-xs">
                      {o.mecanico ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-semibold border border-blue-100">
                          <Wrench className="h-3 w-3" />
                          <span>{o.mecanico.usuario.nombre}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 font-semibold border border-slate-100">
                          <Wrench className="h-3 w-3" />
                          <span>Sin mecánico asignado</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Cliente</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {o.vehiculo.cliente.usuario.nombre}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Estado</span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mt-0.5">
                    {o.estado_actual.nombre_estado}
                  </span>
                </div>
                <div className="flex gap-2">
                  {id_rol !== 4 && (
                    <button onClick={() => openEditModal(o)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  <Link href={`/servicios-realizados?ordenId=${o.id_orden}`} className="p-2 hover:bg-orange-50 rounded-lg text-slate-400 hover:text-orange-600 transition-colors">
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">{modalMode === 'create' ? 'Nueva Orden' : 'Editar Orden'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">{formError}</div>}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Motivo de Ingreso</label>
                  <input required type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vehículo</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none" value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)}>
                    {vehiculos.map(v => <option key={v.id_vehiculo} value={v.id_vehiculo}>{v.placa} - {v.marca} {v.modelo}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Prioridad</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none" value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kilometraje</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none" value={kilometraje} onChange={(e) => setKilometraje(parseInt(e.target.value))} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mecánico Asignado</label>
                  <select required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500" value={mecanicoId} onChange={(e) => setMecanicoId(e.target.value)}>
                    <option value="">Seleccione un mecánico...</option>
                    {mecanicos.map(m => (
                      <option key={m.id_mecanico} value={m.id_mecanico}>
                        {m.usuario.nombre} - {m.especialidad}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Estado</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none" value={estadoId} onChange={(e) => setEstadoId(e.target.value)}>
                    {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre_estado}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                >
                  {formSubmitting ? 'Guardando...' : (modalMode === 'create' ? 'Crear Orden' : 'Actualizar Orden')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
