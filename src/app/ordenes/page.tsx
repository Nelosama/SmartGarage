'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Search,
  Edit2,
  Wrench,
  Car,
  X,
  Play,
  Eye,
  User,
  ChevronDown,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface Vehiculo {
  id_vehiculo: number
  placa: string
  marca: string
  modelo: string
  anio?: number | null
  color?: string | null
  vin?: string | null
  tipo_combustible?: string | null
  kilometraje_actual?: number | null
  id_cliente: number
  cliente: {
    usuario: {
      nombre: string
    }
  }
}

interface Mecanico {
  id_mecanico: number
  id_usuario?: number
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

function toDateInputValue(dateValue?: string | null) {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

function vehiculoLabel(v: Vehiculo) {
  return `${v.placa} - ${v.marca} ${v.modelo}`
}

export default function OrdenesPage() {
  const { data: session } = useSession()
  const user = session?.user as { id_usuario?: string; id_rol?: number; name?: string } | undefined
  const id_rol = user?.id_rol ? Number(user.id_rol) : null

  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([])
  const [currentMecanico, setCurrentMecanico] = useState<Mecanico | null>(null)
  const [estados, setEstados] = useState<Estado[]>([])

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'todos' | 'Recibido' | 'En reparación' | 'Listo para entrega'>('todos')
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null)

  const [motivo, setMotivo] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [estadoId, setEstadoId] = useState<string>('')
  const [mecanicoId, setMecanicoId] = useState<string>('')
  const [vehiculoId, setVehiculoId] = useState<string>('')
  const [vehiculoSearch, setVehiculoSearch] = useState('')
  const [vehiculoDropdownOpen, setVehiculoDropdownOpen] = useState(false)
  const [prioridad, setPrioridad] = useState('Media')
  const [kilometraje, setKilometraje] = useState<string>('')
  const [fechaIngreso, setFechaIngreso] = useState('')
  const [fechaEstimada, setFechaEstimada] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const selectedVehiculo = useMemo(() => {
    if (!vehiculoId) return null
    return vehiculos.find((v) => Number(v.id_vehiculo) === Number(vehiculoId)) || null
  }, [vehiculoId, vehiculos])

  const vehiculosFiltrados = useMemo(() => {
    const query = vehiculoSearch.toLowerCase().trim()

    if (!query) return vehiculos

    return vehiculos.filter((v) => {
      const cliente = v.cliente?.usuario?.nombre || ''

      const text = `
        ${v.placa}
        ${v.marca}
        ${v.modelo}
        ${v.anio || ''}
        ${v.color || ''}
        ${cliente}
      `.toLowerCase()

      return text.includes(query)
    })
  }, [vehiculoSearch, vehiculos])

  const obtenerUltimoKilometraje = (idVehiculo: number) => {
    const ordenesVehiculo = ordenes
      .filter((o) => Number(o.id_vehiculo) === Number(idVehiculo))
      .filter((o) => o.kilometraje_ingreso !== null && o.kilometraje_ingreso !== undefined)
      .sort((a, b) => {
        const fechaA = new Date(a.fecha_ingreso).getTime()
        const fechaB = new Date(b.fecha_ingreso).getTime()
        return fechaB - fechaA
      })

    const ultimoKmOrden = ordenesVehiculo[0]?.kilometraje_ingreso

    if (ultimoKmOrden && Number(ultimoKmOrden) > 0) {
      return String(ultimoKmOrden)
    }

    const vehiculo = vehiculos.find((v) => Number(v.id_vehiculo) === Number(idVehiculo))
    const kmActual = vehiculo?.kilometraje_actual

    if (kmActual && Number(kmActual) > 0) {
      return String(kmActual)
    }

    return ''
  }

  const seleccionarVehiculo = (vehiculo: Vehiculo) => {
    setVehiculoId(String(vehiculo.id_vehiculo))
    setVehiculoSearch(vehiculoLabel(vehiculo))
    setVehiculoDropdownOpen(false)

    if (modalMode === 'create') {
      setKilometraje(obtenerUltimoKilometraje(vehiculo.id_vehiculo))
    }
  }

  const handleTakeOrder = async (orderId: number) => {
    if (!currentMecanico) return

    try {
      setLoading(true)

      const res = await fetch(`/api/ordenes/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_mecanico: currentMecanico.id_mecanico,
        }),
      })

      if (!res.ok) throw new Error('Error al tomar la orden')

      fetchOrders(search)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = React.useCallback(async (query = '') => {
    try {
      setLoading(true)

      const ordURL = `/api/ordenes${query ? `?q=${encodeURIComponent(query)}` : ''}`
      const ordRes = await fetch(ordURL)

      if (!ordRes.ok) throw new Error('Error en servidor')

      setOrdenes(await ordRes.json())
      setError(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(`Error: ${msg}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMetadata = React.useCallback(async () => {
    try {
      const [vehRes, mecRes, estRes] = await Promise.all([
        fetch('/api/vehiculos'),
        fetch('/api/mecanicos'),
        fetch('/api/estados_orden'),
      ])

      const vehs = await vehRes.json()
      const mecs = await mecRes.json()
      const ests = await estRes.json()

      setVehiculos(Array.isArray(vehs) ? vehs : [])
      setMecanicos(Array.isArray(mecs) ? mecs : [])
      setEstados(Array.isArray(ests) ? ests : [])

      if (id_rol === 3 && user?.id_usuario) {
        const myMec = mecs.find((m: Mecanico) => Number(m.id_usuario) === parseInt(user.id_usuario || '0'))
        if (myMec) setCurrentMecanico(myMec)
      }
    } catch (err) {
      console.error('Metadata fetch error:', err)
    }
  }, [id_rol, user?.id_usuario])

  useEffect(() => {
    let mounted = true

    ;(async () => {
      if (!mounted) return
      await fetchMetadata()
      await fetchOrders()
    })()

    return () => {
      mounted = false
    }
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
    setEstadoId(
      estados.find((e) => e.nombre_estado === 'Recibido')?.id_estado?.toString() ||
        estados[0]?.id_estado?.toString() ||
        ''
    )
    setMecanicoId('')
    setVehiculoId('')
    setVehiculoSearch('')
    setVehiculoDropdownOpen(false)
    setPrioridad('Media')
    setKilometraje('')
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
    setVehiculoSearch(orden.vehiculo ? vehiculoLabel(orden.vehiculo) : '')
    setVehiculoDropdownOpen(false)
    setPrioridad(orden.prioridad)
    setKilometraje(
      orden.kilometraje_ingreso !== null && orden.kilometraje_ingreso !== undefined
        ? String(orden.kilometraje_ingreso)
        : ''
    )
    setFechaIngreso(toDateInputValue(orden.fecha_ingreso))
    setFechaEstimada(toDateInputValue(orden.fecha_estimada_entrega))
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!vehiculoId) {
      setFormError('Debes seleccionar un vehículo')
      return
    }

    if (!kilometraje.trim()) {
      setFormError('Debes ingresar el kilometraje del vehículo')
      return
    }

    try {
      setFormSubmitting(true)
      setFormError(null)

      const url = modalMode === 'create' ? '/api/ordenes' : `/api/ordenes/${selectedOrden?.id_orden}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'

      const selectedVeh = vehiculos.find((v) => v.id_vehiculo === parseInt(vehiculoId))

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivo_ingreso: motivo,
          observaciones:
            id_rol === 3
              ? observaciones
              : modalMode === 'edit'
                ? selectedOrden?.observaciones || null
                : null,
          id_estado_actual: parseInt(estadoId),
          id_mecanico: mecanicoId ? parseInt(mecanicoId) : null,
          id_vehiculo: parseInt(vehiculoId),
          id_cliente: selectedVeh?.id_cliente,
          prioridad,
          kilometraje_ingreso: Number(kilometraje),
          fecha_ingreso: fechaIngreso ? new Date(fechaIngreso).toISOString() : null,
          fecha_estimada_entrega: fechaEstimada ? new Date(fechaEstimada).toISOString() : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.details || data?.error || 'Error al guardar')
      }

      setIsModalOpen(false)
      fetchOrders(search)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setFormError(msg)
    } finally {
      setFormSubmitting(false)
    }
  }

  const filteredOrdenes = useMemo(() => {
    return ordenes.filter((o) => {
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
          <p className="text-slate-500 text-sm">
            Control de diagnóstico y reparaciones en curso.
          </p>
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

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['todos', 'Recibido', 'En reparación', 'Listo para entrega'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
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
          <div className="text-center py-12 text-slate-400 bg-white border border-slate-200 rounded-2xl">
            No hay órdenes que coincidan.
          </div>
        ) : (
          filteredOrdenes.map((o) => (
            <div
              key={o.id_orden}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-orange-200 transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex gap-4 items-start">
                  <div className="p-3 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                    <Car className="h-6 w-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded tracking-wider">
                        #{o.id_orden}
                      </span>

                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                          o.prioridad === 'Alta'
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : o.prioridad === 'Media'
                              ? 'bg-amber-50 text-amber-600 border-amber-100'
                              : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}
                      >
                        {o.prioridad}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-lg">
                      {o.motivo_ingreso}
                    </h3>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
                      <p className="text-sm text-slate-500">
                        {o.vehiculo.marca} {o.vehiculo.modelo} •{' '}
                        <span className="font-mono font-bold text-slate-700">
                          {o.vehiculo.placa}
                        </span>
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

                    {o.observaciones && (
                      <p className="mt-2 text-xs text-slate-500 italic">
                        Observación: {o.observaciones}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Cliente
                    </span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {o.vehiculo.cliente.usuario.nombre}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Estado
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mt-0.5">
                      {o.estado_actual.nombre_estado}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {id_rol === 3 && !o.id_mecanico && (
                      <button
                        onClick={() => handleTakeOrder(o.id_orden)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase rounded-lg transition-all shadow-md shadow-orange-500/20 active:scale-95"
                        title="Tomar esta orden"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        Tomar Orden
                      </button>
                    )}

                    {id_rol !== 4 && (
                      <button
                        onClick={() => openEditModal(o)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                        title="Editar orden"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}

                    <Link
                      href={`/servicios-realizados?ordenId=${o.id_orden}`}
                      className="p-2 hover:bg-orange-50 rounded-lg text-slate-400 hover:text-orange-600 transition-colors"
                      title="Ver servicios"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-scale-in max-h-[calc(100vh-2rem)] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-slate-800">
                {modalMode === 'create' ? 'Nueva Orden' : 'Editar Orden'}
              </h2>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                  {formError}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="motivo" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Motivo de Ingreso
                  </label>
                  <input
                    id="motivo"
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Vehículo
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                      value={vehiculoSearch}
                      placeholder="Escribe placa, marca, modelo o cliente..."
                      onFocus={() => setVehiculoDropdownOpen(true)}
                      onChange={(e) => {
                        setVehiculoSearch(e.target.value)
                        setVehiculoDropdownOpen(true)

                        const exact = vehiculos.find((v) => {
                          const value = e.target.value.toLowerCase().trim()
                          return (
                            v.placa.toLowerCase() === value ||
                            vehiculoLabel(v).toLowerCase() === value
                          )
                        })

                        if (!exact) {
                          setVehiculoId('')
                        } else {
                          seleccionarVehiculo(exact)
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setVehiculoDropdownOpen(false), 150)
                      }}
                    />

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setVehiculoDropdownOpen((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  {vehiculoDropdownOpen && (
                    <div className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl">
                      {vehiculosFiltrados.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-400">
                          No se encontraron vehículos.
                        </div>
                      ) : (
                        vehiculosFiltrados.map((v) => (
                          <button
                            key={v.id_vehiculo}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              seleccionarVehiculo(v)
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-slate-100 last:border-b-0"
                          >
                            <p className="font-bold text-slate-800 text-sm">
                              {v.placa} - {v.marca} {v.modelo}
                            </p>
                            <p className="text-xs text-slate-500">
                              Cliente: {v.cliente?.usuario?.nombre || 'No registrado'}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="prioridad" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Prioridad
                  </label>
                  <select
                    id="prioridad"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>

                {selectedVehiculo && (
                  <div className="md:col-span-2 bg-orange-50 border border-orange-100 rounded-2xl p-4">
                    <div className="grid md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400">
                          Vehículo seleccionado
                        </p>
                        <p className="font-bold text-slate-800">
                          {selectedVehiculo.marca} {selectedVehiculo.modelo}
                        </p>
                        <p className="text-xs text-slate-600">
                          Placa: {selectedVehiculo.placa}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400">
                          Cliente dueño
                        </p>
                        <p className="font-bold text-slate-800">
                          {selectedVehiculo.cliente?.usuario?.nombre || 'No registrado'}
                        </p>
                        <p className="text-xs text-slate-600">
                          ID Cliente: {selectedVehiculo.id_cliente}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400">
                          Datos adicionales
                        </p>
                        <p className="text-xs text-slate-600">
                          Año: {selectedVehiculo.anio || 'N/A'} | Color: {selectedVehiculo.color || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-600">
                          KM registrado: {selectedVehiculo.kilometraje_actual || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="kilometraje" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Kilometraje
                  </label>
                  <input
                    id="kilometraje"
                    type="number"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    value={kilometraje}
                    onChange={(e) => setKilometraje(e.target.value)}
                    placeholder="Ingresa kilometraje actual"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Si el vehículo tiene historial, se carga el último kilometraje registrado.
                  </p>
                </div>

                <div>
                  <label htmlFor="mecanico" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Mecánico Asignado
                  </label>
                  <select
                    id="mecanico"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                    value={mecanicoId}
                    onChange={(e) => setMecanicoId(e.target.value)}
                  >
                    <option value="">Sin asignar / Pendiente</option>
                    {mecanicos.map((m) => (
                      <option key={m.id_mecanico} value={m.id_mecanico}>
                        {m.usuario.nombre} - {m.especialidad}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="estado" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Estado
                  </label>
                  <select
                    id="estado"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    value={estadoId}
                    onChange={(e) => setEstadoId(e.target.value)}
                  >
                    {estados.map((e) => (
                      <option key={e.id_estado} value={e.id_estado}>
                        {e.nombre_estado}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="fechaIngreso" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Fecha de Ingreso
                  </label>
                  <input
                    id="fechaIngreso"
                    type="date"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    value={fechaIngreso}
                    onChange={(e) => setFechaIngreso(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="fechaEstimada" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Fecha Estimada de Entrega
                  </label>
                  <input
                    id="fechaEstimada"
                    type="date"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    value={fechaEstimada}
                    onChange={(e) => setFechaEstimada(e.target.value)}
                  />
                </div>

                {id_rol === 3 && (
                  <div className="md:col-span-2">
                    <label htmlFor="observaciones" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Observaciones del mecánico
                    </label>
                    <textarea
                      id="observaciones"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 min-h-[100px] resize-none"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Ejemplo: Se detectó desgaste en las pastillas delanteras..."
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-slate-100 -mx-6 -mb-6 px-6 py-4">
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
                  {formSubmitting
                    ? 'Guardando...'
                    : modalMode === 'create'
                      ? 'Crear Orden'
                      : 'Actualizar Orden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}