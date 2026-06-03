'use client'

import React, { useState, useEffect } from 'react'
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
  Eye
} from 'lucide-react'
import Link from 'next/link'

interface Cliente {
  id: number
  nombre: string
}

interface Vehiculo {
  id: number
  placa: string
  marca: string
  modelo: string
  cliente: Cliente
}

interface ServicioRealizado {
  id: number
  descripcion: string
  repuesto: string
  costo: number
}

interface Orden {
  id: number
  servicio: string
  diagnostico: string
  estado: 'Pendiente' | 'En progreso' | 'Completado'
  fecha: string
  vehiculoId: number
  vehiculo: Vehiculo
  serviciosRealizados?: ServicioRealizado[]
}

export default function OrdenesPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'todos' | 'Pendiente' | 'En progreso' | 'Completado'>('todos')
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null)
  
  // Form states
  const [servicio, setServicio] = useState('')
  const [diagnostico, setDiagnostico] = useState('')
  const [estado, setEstado] = useState<'Pendiente' | 'En progreso' | 'Completado'>('Pendiente')
  const [fecha, setFecha] = useState('')
  const [vehiculoId, setVehiculoId] = useState<string>('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch orders and vehicles
  const fetchData = async (query = '') => {
    try {
      setLoading(true)
      const ordURL = `/api/ordenes${query ? `?q=${encodeURIComponent(query)}` : ''}`
      const [ordRes, vehRes] = await Promise.all([
        fetch(ordURL),
        fetch('/api/vehiculos')
      ])

      if (!ordRes.ok || !vehRes.ok) throw new Error('Error al conectar con el servidor')

      const ordData = await ordRes.json()
      const vehData = await vehRes.json()

      setOrdenes(ordData)
      setVehiculos(vehData)
      setError(null)
    } catch (err: any) {
      console.error(err)
      setError('No se pudieron cargar los datos de la base de datos local. Usando datos demo.')
      
      // Fallback demo data
      setVehiculos([
        { id: 1, placa: 'MEC-1234', marca: 'Toyota', modelo: 'Hilux', cliente: { id: 1, nombre: 'Juan Pérez' } },
        { id: 2, placa: 'ABC-7890', marca: 'Honda', modelo: 'Civic', cliente: { id: 2, nombre: 'María Rodríguez' } },
        { id: 3, placa: 'XYZ-5544', marca: 'Ford', modelo: 'Ranger', cliente: { id: 3, nombre: 'Carlos Mendoza' } },
        { id: 4, placa: 'PQR-9988', marca: 'Hyundai', modelo: 'Tucson', cliente: { id: 4, nombre: 'Ana Gómez' } }
      ])

      setOrdenes([
        {
          id: 1,
          servicio: 'Alineación y Balanceo',
          diagnostico: 'Desviación leve hacia la izquierda en suspensión delantera.',
          estado: 'En progreso',
          fecha: new Date().toISOString().split('T')[0],
          vehiculoId: 1,
          vehiculo: { id: 1, placa: 'MEC-1234', marca: 'Toyota', modelo: 'Hilux', cliente: { id: 1, nombre: 'Juan Pérez' } },
          serviciosRealizados: [
            { id: 1, descripcion: 'Alineado computarizado', repuesto: 'Ninguno', costo: 45.00 }
          ]
        },
        {
          id: 2,
          servicio: 'Cambio de Aceite y Filtros',
          diagnostico: 'Aceite quemado por vencimiento de kilometraje. Requiere cambio de filtro de aire.',
          estado: 'Pendiente',
          fecha: new Date().toISOString().split('T')[0],
          vehiculoId: 2,
          vehiculo: { id: 2, placa: 'ABC-7890', marca: 'Honda', modelo: 'Civic', cliente: { id: 2, nombre: 'María Rodríguez' } },
          serviciosRealizados: []
        },
        {
          id: 3,
          servicio: 'Frenos y Rectificación de Discos',
          diagnostico: 'Balatas gastadas con menos del 15% de vida útil. Discos rayados.',
          estado: 'Completado',
          fecha: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          vehiculoId: 3,
          vehiculo: { id: 3, placa: 'XYZ-5544', marca: 'Ford', modelo: 'Ranger', cliente: { id: 3, nombre: 'Carlos Mendoza' } },
          serviciosRealizados: [
            { id: 2, descripcion: 'Cambio de balatas delanteras', repuesto: 'Balatas Cerámicas', costo: 120.00 },
            { id: 3, descripcion: 'Rectificación de discos', repuesto: 'Ninguno', costo: 60.00 }
          ]
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearch(val)
    fetchData(val)
  }

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedOrden(null)
    setServicio('')
    setDiagnostico('')
    setEstado('Pendiente')
    setFecha(new Date().toISOString().split('T')[0])
    setVehiculoId(vehiculos[0]?.id.toString() || '')
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (orden: Orden) => {
    setModalMode('edit')
    setSelectedOrden(orden)
    setServicio(orden.servicio)
    setDiagnostico(orden.diagnostico)
    setEstado(orden.estado)
    setFecha(new Date(orden.fecha).toISOString().split('T')[0])
    setVehiculoId(orden.vehiculoId.toString())
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!servicio || !diagnostico || !estado || !fecha || !vehiculoId) {
      setFormError('Todos los campos son obligatorios')
      return
    }

    try {
      setFormSubmitting(true)
      setFormError(null)

      const url = modalMode === 'create' ? '/api/ordenes' : `/api/ordenes/${selectedOrden?.id}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicio,
          diagnostico,
          estado,
          fecha: new Date(fecha).toISOString(),
          vehiculoId: parseInt(vehiculoId, 10)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al guardar la orden de trabajo')
      }

      setIsModalOpen(false)
      fetchData(search)
    } catch (err: any) {
      console.error(err)
      setFormError(err.message || 'Error en la conexión. Guardado simulado en modo demo.')

      // Simulate client side update in demo mode
      const selectedVehObj = vehiculos.find(v => v.id === parseInt(vehiculoId, 10)) || {
        id: 1,
        placa: 'MEC-1234',
        marca: 'Toyota',
        modelo: 'Hilux',
        cliente: { id: 1, nombre: 'Juan Pérez' }
      }

      if (modalMode === 'create') {
        const mockNew: Orden = {
          id: Date.now(),
          servicio,
          diagnostico,
          estado,
          fecha,
          vehiculoId: parseInt(vehiculoId, 10),
          vehiculo: selectedVehObj,
          serviciosRealizados: []
        }
        setOrdenes(prev => [mockNew, ...prev])
        setIsModalOpen(false)
      } else if (modalMode === 'edit' && selectedOrden) {
        setOrdenes(prev => prev.map(o => o.id === selectedOrden.id ? {
          ...o,
          servicio,
          diagnostico,
          estado,
          fecha,
          vehiculoId: parseInt(vehiculoId, 10),
          vehiculo: selectedVehObj
        } : o))
        setIsModalOpen(false)
      }
    } finally {
      setFormSubmitting(false)
    }
  }

  const updateOrderStatus = async (orden: Orden, newStatus: 'Pendiente' | 'En progreso' | 'Completado') => {
    try {
      const res = await fetch(`/api/ordenes/${orden.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicio: orden.servicio,
          diagnostico: orden.diagnostico,
          estado: newStatus,
          fecha: new Date(orden.fecha).toISOString(),
          vehiculoId: orden.vehiculoId
        })
      })

      if (!res.ok) throw new Error('Error al actualizar el estado')
      fetchData(search)
    } catch (err) {
      console.error(err)
      // Simulate state update
      setOrdenes(prev => prev.map(o => o.id === orden.id ? { ...o, estado: newStatus } : o))
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta orden de trabajo? Se borrarán todos los servicios realizados vinculados.')) return

    try {
      const res = await fetch(`/api/ordenes/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar la orden')
      }

      fetchData(search)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Error al eliminar. Simulado en modo demo.')
      setOrdenes(prev => prev.filter(o => o.id !== id))
    }
  }

  const filteredOrdenes = ordenes.filter(o => {
    if (activeTab === 'todos') return true
    return o.estado === activeTab
  })

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Órdenes de Trabajo</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Registro, diagnóstico y control de estado de reparaciones en taller
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Wrench className="h-4.5 w-4.5" />
          Nueva Orden de Trabajo
        </button>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-900 self-start">
          {(['todos', 'Pendiente', 'En progreso', 'Completado'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-slate-800 dark:bg-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab === 'todos' ? 'Todas' : tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por placa, servicio, diagnóstico..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:focus:ring-blue-400/25 text-sm transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Database Warning */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/35 dark:border-amber-900/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Orders Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm gap-3">
          <Loader2 className="h-8 w-8 text-amber-600 dark:text-amber-400 animate-spin" />
          <p className="text-xs text-slate-400 dark:text-slate-500">Cargando órdenes de trabajo...</p>
        </div>
      ) : filteredOrdenes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 dark:text-slate-600 mb-4">
            <Wrench className="h-6 w-6" />
          </div>
          <h4 className="font-bold text-slate-700 dark:text-slate-300">No hay órdenes de trabajo</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
            {search ? 'No se encontraron resultados para la búsqueda' : 'Registra una orden para comenzar el proceso técnico'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrdenes.map((orden) => {
            const totalCost = orden.serviciosRealizados?.reduce((sum, s) => sum + s.costo, 0) || 0
            
            return (
              <div 
                key={orden.id} 
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Status header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      orden.estado === 'Completado'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : orden.estado === 'En progreso'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        orden.estado === 'Completado' ? 'bg-emerald-500' : orden.estado === 'En progreso' ? 'bg-blue-500' : 'bg-amber-500'
                      }`} />
                      {orden.estado}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: #{orden.id}</span>
                  </div>

                  {/* Main Title & Vehicle details */}
                  <div className="space-y-1.5 mb-4">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 line-clamp-1">{orden.servicio}</h4>
                    
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Car className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        {orden.vehiculo.marca} {orden.vehiculo.modelo} • <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-400">{orden.vehiculo.placa}</span>
                      </span>
                    </div>
                    
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      Cliente: {orden.vehiculo.cliente.nombre}
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs border border-slate-100 dark:border-slate-800/50 mb-4">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      <FileText className="h-3 w-3" />
                      Diagnóstico Inicial
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                      &ldquo;{orden.diagnostico}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Footer section (Actions and Details) */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(orden.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    
                    {/* Cost summary badge */}
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Costo: <span className="text-emerald-500">${totalCost.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Quick state change and options */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Status quick toggle buttons */}
                    <div className="flex gap-1.5">
                      {orden.estado === 'Pendiente' && (
                        <button
                          onClick={() => updateOrderStatus(orden, 'En progreso')}
                          className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-950/70 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <Play className="h-3 w-3" /> Iniciar
                        </button>
                      )}
                      {orden.estado === 'En progreso' && (
                        <button
                          onClick={() => updateOrderStatus(orden, 'Completado')}
                          className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/70 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <CheckCircle className="h-3 w-3" /> Completar
                        </button>
                      )}
                      {orden.estado === 'Completado' && (
                        <span className="text-[10px] text-emerald-500 font-bold tracking-wide">✓ Trabajo Terminado</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Link to performed services */}
                      <Link
                        href={`/servicios-realizados?ordenId=${orden.id}`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800 transition-colors"
                        title="Ver servicios realizados y repuestos"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => openEditModal(orden)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-amber-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Editar orden"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(orden.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Eliminar orden"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
                  {modalMode === 'create' ? 'Crear Orden de Trabajo' : 'Editar Orden de Trabajo'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Establece el diagnóstico inicial, tipo de servicio y asócialo al vehículo
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
                  Servicio Requerido / Motivo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cambio de bujías y afinación"
                  value={servicio}
                  onChange={(e) => setServicio(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500/25 dark:focus:ring-amber-400/25 text-sm transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Diagnóstico Técnico Inicial
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ej. El motor vibra al estar en marcha. El escáner arroja falla en cilindro 3."
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500/25 dark:focus:ring-amber-400/25 text-sm transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Estado Inicial
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500/25 dark:focus:ring-amber-400/25 text-sm transition-all"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En progreso">En progreso</option>
                    <option value="Completado">Completado</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Fecha de Ingreso
                  </label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500/25 dark:focus:ring-amber-400/25 text-sm transition-all"
                  />
                </div>
              </div>

              {/* Vehicle select dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Vehículo en Reparación
                </label>
                {vehiculos.length === 0 ? (
                  <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-xl border border-red-200/40">
                    No hay vehículos registrados en el sistema. Registra un vehículo antes de crear una orden.
                  </div>
                ) : (
                  <select
                    value={vehiculoId}
                    onChange={(e) => setVehiculoId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500/25 dark:focus:ring-amber-400/25 text-sm transition-all"
                  >
                    {vehiculos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.marca} {v.modelo} (Placa: {v.placa}) • Propietario: {v.cliente.nombre}
                      </option>
                    ))}
                  </select>
                )}
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
                  disabled={formSubmitting || vehiculos.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {modalMode === 'create' ? 'Guardar Orden' : 'Actualizar Orden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
