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

  const fetchData = React.useCallback(async (query = '') => {
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
      const message = err instanceof Error ? err.message : String(err)
      console.error(err)
      setError(`Error: ${message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (mounted) {
        await fetchData()
      }
    })();
    return () => {
      mounted = false
    }
  }, [fetchData])

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
      void fetchData(search)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(err)
      setFormError(message)
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

      void fetchData(search)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(err)
      alert(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800">Registro de Vehículos</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestión de vehículos de clientes en el taller mecánico
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
        >
          <Car className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" />
          Registrar Vehículo
        </button>
      </div>

      <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
        {error && (
          <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
            <AlertCircle className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" />
            <span>{error}</span>
          </div>
        )}

        <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
          <Search className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" />
          <input
            type="text"
            placeholder="Buscar por placa, marca o modelo..."
            value={search}
            onChange={handleSearchChange}
            className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
          />
        </div>
      </div>

      <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
        {loading ? (
          <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
            <Loader2 className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" />
            <p className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Cargando vehículos...</p>
          </div>
        ) : vehiculos.length === 0 ? (
          <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
            <Car className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" />
            <h4 className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">No se encontraron vehículos</h4>
          </div>
        ) : (
          <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
            <table className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
              <thead>
                <tr className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                  <th className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Placa</th>
                  <th className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Vehículo</th>
                  <th className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Cliente</th>
                  <th className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Info Adicional</th>
                  <th className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Acciones</th>
                </tr>
              </thead>
              <tbody className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                {vehiculos.map((vehiculo) => (
                  <tr key={vehiculo.id_vehiculo} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                    <td className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                      <span className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                        {vehiculo.placa}
                      </span>
                    </td>
                    <td className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                      <div>
                        <p className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">{vehiculo.marca} {vehiculo.modelo}</p>
                        <p className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Año: {vehiculo.anio || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                      <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                        <User className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" />
                        <span>{vehiculo.cliente?.usuario?.nombre || 'Sin propietario'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                      {vehiculo.color && <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Color: {vehiculo.color}</div>}
                      {vehiculo.tipo_combustible && <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"><Fuel className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"/> {vehiculo.tipo_combustible}</div>}
                      <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">{vehiculo.kilometraje_actual.toLocaleString()} KM</div>
                    </td>
                    <td className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                      <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                        <button
                          onClick={() => openEditModal(vehiculo)}
                          className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                        >
                          <Edit2 className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" />
                        </button>
                        <button
                          onClick={() => handleDelete(vehiculo.id_vehiculo)}
                          className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                        >
                          <Trash2 className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" />
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
        <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
          <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
            <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
              <h3 className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                {modalMode === 'create' ? 'Registrar Nuevo Vehículo' : 'Editar Datos de Vehículo'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                <X className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" />
              </button>
            </div>

            {formError && (
              <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                <AlertCircle className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all" /> {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
              <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                  <label className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Número de Placa</label>
                  <input
                    type="text"
                    required
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                  />
                </div>
                <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                  <label className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Año</label>
                  <input
                    type="number"
                    value={anio}
                    onChange={(e) => setAnio(parseInt(e.target.value, 10))}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                  />
                </div>
              </div>

              <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                  <label className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Marca</label>
                  <input
                    type="text"
                    required
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                  />
                </div>
                <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                  <label className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Modelo</label>
                  <input
                    type="text"
                    required
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                  />
                </div>
              </div>

              <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                  <label className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                  />
                </div>
                <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                  <label className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Combustible</label>
                  <input
                    type="text"
                    placeholder="Ej. Gasolina, Diesel, Híbrido"
                    value={tipoCombustible}
                    onChange={(e) => setTipoCombustible(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                  />
                </div>
              </div>

              <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                <label className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Kilometraje Actual</label>
                <input
                  type="number"
                  value={kilometraje}
                  onChange={(e) => setKilometraje(parseInt(e.target.value, 10))}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                />
              </div>

              <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                <label className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Número de VIN</label>
                <input
                  type="text"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                />
              </div>

              <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
                <label className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Propietario / Cliente</label>
                {clientes.length === 0 ? (
                  <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">No hay clientes registrados</div>
                ) : (
                  <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                  >
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} (ID: #{c.id})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">
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
