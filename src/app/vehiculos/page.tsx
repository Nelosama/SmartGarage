'use client'

import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  Car,
  User,
  Calendar,
  X,
  AlertCircle
} from 'lucide-react'

interface Cliente {
  id: number
  nombre: string
}

interface Vehiculo {
  id: number
  placa: string
  marca: string
  modelo: string
  anio: number
  clienteId: number
  cliente: Cliente
}

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null)
  
  // Form states
  const [placa, setPlaca] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [anio, setAnio] = useState<number>(new Date().getFullYear())
  const [clienteId, setClienteId] = useState<string>('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch vehicles and clients
  const fetchData = async (query = '') => {
    try {
      setLoading(true)
      const vehURL = `/api/vehiculos${query ? `?q=${encodeURIComponent(query)}` : ''}`
      const [vehRes, cliRes] = await Promise.all([
        fetch(vehURL),
        fetch('/api/clientes')
      ])

      if (!vehRes.ok || !cliRes.ok) throw new Error('Error al conectar con el servidor')

      const vehData = await vehRes.json()
      const cliData = await cliRes.json()

      setVehiculos(vehData)
      setClientes(cliData)
      setError(null)
    } catch (err: unknown) {
      console.error(err)
      setError('No se pudieron cargar los datos de la base de datos local. Usando datos demo.')
      
      // Fallback demo data
      setClientes([
        { id: 1, nombre: 'Juan Pérez' },
        { id: 2, nombre: 'María Rodríguez' },
        { id: 3, nombre: 'Carlos Mendoza' },
        { id: 4, nombre: 'Ana Gómez' }
      ])

      setVehiculos([
        { id: 1, placa: 'MEC-1234', marca: 'Toyota', modelo: 'Hilux', anio: 2021, clienteId: 1, cliente: { id: 1, nombre: 'Juan Pérez' } },
        { id: 2, placa: 'ABC-7890', marca: 'Honda', modelo: 'Civic', anio: 2018, clienteId: 2, cliente: { id: 2, nombre: 'María Rodríguez' } },
        { id: 3, placa: 'XYZ-5544', marca: 'Ford', modelo: 'Ranger', anio: 2020, clienteId: 3, cliente: { id: 3, nombre: 'Carlos Mendoza' } },
        { id: 4, placa: 'PQR-9988', marca: 'Hyundai', modelo: 'Tucson', anio: 2019, clienteId: 4, cliente: { id: 4, nombre: 'Ana Gómez' } }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      await fetchData()
    }
    void init()
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearch(val)
    fetchData(val)
  }

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedVehiculo(null)
    setPlaca('')
    setMarca('')
    setModelo('')
    setAnio(new Date().getFullYear())
    setClienteId(clientes[0]?.id.toString() || '')
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (vehiculo: Vehiculo) => {
    setModalMode('edit')
    setSelectedVehiculo(vehiculo)
    setPlaca(vehiculo.placa)
    setMarca(vehiculo.marca)
    setModelo(vehiculo.modelo)
    setAnio(vehiculo.anio)
    setClienteId(vehiculo.clienteId.toString())
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!placa || !marca || !modelo || !anio || !clienteId) {
      setFormError('Todos los campos son obligatorios')
      return
    }

    try {
      setFormSubmitting(true)
      setFormError(null)

      const url = modalMode === 'create' ? '/api/vehiculos' : `/api/vehiculos/${selectedVehiculo?.id}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placa,
          marca,
          modelo,
          anio: parseInt(anio.toString(), 10),
          clienteId: parseInt(clienteId, 10)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al guardar el vehículo')
      }

      setIsModalOpen(false)
      fetchData(search)
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Error en la conexión. Guardado simulado en modo demo.'
      setFormError(message)

      // Simulate client side update in demo mode
      const selectedClientObj = clientes.find(c => c.id === parseInt(clienteId, 10)) || { id: 1, nombre: 'Juan Pérez' }
      if (modalMode === 'create') {
        const mockNew = {
          id: Date.now(),
          placa,
          marca,
          modelo,
          anio: parseInt(anio.toString(), 10),
          clienteId: parseInt(clienteId, 10),
          cliente: selectedClientObj
        }
        setVehiculos(prev => [...prev, mockNew])
        setIsModalOpen(false)
      } else if (modalMode === 'edit' && selectedVehiculo) {
        setVehiculos(prev => prev.map(v => v.id === selectedVehiculo.id ? {
          ...v,
          placa,
          marca,
          modelo,
          anio: parseInt(anio.toString(), 10),
          clienteId: parseInt(clienteId, 10),
          cliente: selectedClientObj
        } : v))
        setIsModalOpen(false)
      }
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este vehículo? Se eliminarán todas las órdenes asociadas.')) return

    try {
      const res = await fetch(`/api/vehiculos/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar el vehículo')
      }

      fetchData(search)
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Error al eliminar. Simulado en modo demo.'
      alert(message)
      setVehiculos(prev => prev.filter(v => v.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Registro de Vehículos</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Gestión de vehículos de clientes en el taller mecánico
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Car className="h-4.5 w-4.5" />
          Registrar Vehículo
        </button>
      </div>

      {/* Search and warnings */}
      <div className="flex flex-col gap-4">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/35 dark:border-amber-900/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por placa, marca o modelo..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:focus:ring-blue-400/25 text-sm transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400 dark:text-slate-500">Cargando vehículos...</p>
          </div>
        ) : vehiculos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 dark:text-slate-600 mb-4">
              <Car className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-700 dark:text-slate-300">No se encontraron vehículos</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
              {search ? 'Intenta modificar el término de búsqueda' : 'Registra tu primer vehículo asociado a un cliente'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6">Placa</th>
                  <th className="py-3 px-6">Vehículo</th>
                  <th className="py-3 px-6">Cliente</th>
                  <th className="py-3 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vehiculos.map((vehiculo) => (
                  <tr key={vehiculo.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="py-4.5 px-6 font-mono font-bold text-slate-800 dark:text-slate-200">
                      <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg text-xs border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                        {vehiculo.placa}
                      </span>
                    </td>
                    <td className="py-4.5 px-6">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{vehiculo.marca} {vehiculo.modelo}</p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          Año: {vehiculo.anio}
                        </div>
                      </div>
                    </td>
                    <td className="py-4.5 px-6">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-semibold">{vehiculo.cliente.nombre}</span>
                      </div>
                    </td>
                    <td className="py-4.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(vehiculo)}
                          className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/20 transition-all cursor-pointer"
                          title="Editar vehículo"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vehiculo.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                          title="Eliminar vehículo"
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
                  {modalMode === 'create' ? 'Registrar Nuevo Vehículo' : 'Editar Datos de Vehículo'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Registra los datos del vehículo y asócialo a un cliente
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Número de Placa
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. ABC-123"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:focus:ring-indigo-400/25 text-sm font-mono transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Año de Fabricación
                  </label>
                  <input
                    type="number"
                    required
                    min={1900}
                    max={new Date().getFullYear() + 2}
                    value={anio}
                    onChange={(e) => setAnio(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:focus:ring-indigo-400/25 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Marca
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Nissan"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:focus:ring-indigo-400/25 text-sm transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Modelo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Sentra"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:focus:ring-indigo-400/25 text-sm transition-all"
                  />
                </div>
              </div>

              {/* Client select dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Propietario / Cliente
                </label>
                {clientes.length === 0 ? (
                  <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-xl border border-red-200/40">
                    No hay clientes registrados en el sistema. Registra un cliente antes de agregar vehículos.
                  </div>
                ) : (
                  <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:focus:ring-indigo-400/25 text-sm transition-all"
                  >
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} (ID: #{c.id})
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
                  disabled={formSubmitting || clientes.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {modalMode === 'create' ? 'Guardar Vehículo' : 'Actualizar Vehículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
