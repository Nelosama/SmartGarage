'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  Car,
  User,
  Calendar,
  Tag,
  X,
  AlertCircle,
  Fuel,
  Info
} from 'lucide-react'

interface Cliente {
  id: number
  nombre: string
}

interface Vehiculo {
  id_vehiculo: number
  placa: string
  marca: string
  modelo: string
  anio?: number
  color?: string
  vin?: string
  tipo_combustible?: string
  kilometraje_actual: number
  id_cliente: number
  cliente: {
    usuario: {
      nombre: string
    }
  }
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
  const [color, setColor] = useState('')
  const [vin, setVin] = useState('')
  const [tipoCombustible, setTipoCombustible] = useState('')
  const [kilometraje, setKilometraje] = useState<number>(0)
  const [clienteId, setClienteId] = useState<string>('')

  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

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
    } catch (err: any) {
      console.error(err)
      setError(`Error: ${err.message}`)
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
    setSelectedVehiculo(null)
    setPlaca('')
    setMarca('')
    setModelo('')
    setAnio(new Date().getFullYear())
    setColor('')
    setVin('')
    setTipoCombustible('')
    setKilometraje(0)
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
    setAnio(vehiculo.anio || new Date().getFullYear())
    setColor(vehiculo.color || '')
    setVin(vehiculo.vin || '')
    setTipoCombustible(vehiculo.tipo_combustible || '')
    setKilometraje(vehiculo.kilometraje_actual)
    setClienteId(vehiculo.id_cliente.toString())
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!placa || !marca || !modelo || !clienteId) {
      setFormError('Placa, Marca, Modelo y Cliente son obligatorios')
      return
    }

    try {
      setFormSubmitting(true)
      setFormError(null)

      const url = modalMode === 'create' ? '/api/vehiculos' : `/api/vehiculos/${selectedVehiculo?.id_vehiculo}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placa,
          marca,
          modelo,
          anio: parseInt(anio.toString(), 10),
          clienteId: parseInt(clienteId, 10),
          color,
          vin,
          tipo_combustible: tipoCombustible,
          kilometraje_actual: parseInt(kilometraje.toString(), 10)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.details || data.error || 'Ocurrió un error al guardar el vehículo')
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
    } catch (err: any) {
      console.error(err)
      alert(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Registro de Vehículos</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Gestión de vehículos de clientes en el taller mecánico
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <Car className="h-4 w-4" />
          Registrar Vehículo
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/35">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por placa, marca o modelo..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-400">Cargando vehículos...</p>
          </div>
        ) : vehiculos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4 text-slate-500">
            <Car className="h-10 w-10 mb-4 opacity-20" />
            <h4 className="font-bold">No se encontraron vehículos</h4>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6">Placa</th>
                  <th className="py-3 px-6">Vehículo</th>
                  <th className="py-3 px-6">Cliente</th>
                  <th className="py-3 px-6">Info Adicional</th>
                  <th className="py-3 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vehiculos.map((vehiculo) => (
                  <tr key={vehiculo.id_vehiculo} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-800 dark:text-slate-200">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-xs">
                        {vehiculo.placa}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{vehiculo.marca} {vehiculo.modelo}</p>
                        <p className="text-slate-400 mt-0.5">Año: {vehiculo.anio || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{vehiculo.cliente?.usuario?.nombre || 'Sin propietario'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[10px] space-y-1">
                      {vehiculo.color && <div className="text-slate-500 capitalize">Color: {vehiculo.color}</div>}
                      {vehiculo.tipo_combustible && <div className="flex items-center gap-1 text-slate-500"><Fuel className="h-2.5 w-2.5"/> {vehiculo.tipo_combustible}</div>}
                      <div className="font-semibold text-indigo-500">{vehiculo.kilometraje_actual.toLocaleString()} KM</div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(vehiculo)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 transition-all cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vehiculo.id_vehiculo)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-all cursor-pointer"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                {modalMode === 'create' ? 'Registrar Nuevo Vehículo' : 'Editar Datos de Vehículo'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 text-xs rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Número de Placa</label>
                  <input
                    type="text"
                    required
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Año</label>
                  <input
                    type="number"
                    value={anio}
                    onChange={(e) => setAnio(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Marca</label>
                  <input
                    type="text"
                    required
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Modelo</label>
                  <input
                    type="text"
                    required
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Combustible</label>
                  <input
                    type="text"
                    placeholder="Ej. Gasolina, Diesel, Híbrido"
                    value={tipoCombustible}
                    onChange={(e) => setTipoCombustible(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kilometraje Actual</label>
                <input
                  type="number"
                  value={kilometraje}
                  onChange={(e) => setKilometraje(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Número de VIN</label>
                <input
                  type="text"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Propietario / Cliente</label>
                {clientes.length === 0 ? (
                  <div className="text-xs text-red-500 bg-red-50 p-2.5 rounded-xl">No hay clientes registrados</div>
                ) : (
                  <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm"
                  >
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} (ID: #{c.id})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-900 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || clientes.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50"
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
