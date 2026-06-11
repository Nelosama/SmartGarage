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
  X,
  AlertCircle,
  Fuel
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
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null)
  
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

      setVehiculos(await vehRes.json())
      setClientes(await cliRes.json())
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
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
    try {
      setFormSubmitting(true)
      const url = modalMode === 'create' ? '/api/vehiculos' : `/api/vehiculos/${selectedVehiculo?.id_vehiculo}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placa,
          marca,
          modelo,
          anio: parseInt(anio.toString()),
          clienteId: parseInt(clienteId),
          color,
          vin,
          tipo_combustible: tipoCombustible,
          kilometraje_actual: parseInt(kilometraje.toString())
        })
      })

      if (!res.ok) throw new Error('Error al guardar')
      setIsModalOpen(false)
      fetchData(search)
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro?')) return
    try {
      const res = await fetch(`/api/vehiculos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      fetchData(search)
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Car className="h-8 w-8 text-orange-600" />
            Flota de Vehículos
          </h1>
          <p className="text-slate-500 text-sm">Registro y gestión de unidades de clientes.</p>
        </div>
        <button onClick={openCreateModal} className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Registrar Vehículo
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por placa, marca o modelo..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="px-6 py-4">Vehículo</th>
                <th className="px-6 py-4">Propietario</th>
                <th className="px-6 py-4 text-center">Kilometraje</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Cargando...</td></tr>
              ) : (
                vehiculos.map(v => (
                  <tr key={v.id_vehiculo} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-xs">
                          {v.placa}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{v.marca} {v.modelo}</p>
                          <p className="text-xs text-slate-500">Año {v.anio} • {v.color || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-slate-600"><User className="h-3.5 w-3.5" /> {v.cliente?.usuario?.nombre}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-700">
                      {v.kilometraje_actual.toLocaleString()} KM
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(v)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(v.id_vehiculo)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
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
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">{modalMode === 'create' ? 'Nuevo Vehículo' : 'Editar Vehículo'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Placa</label>
                  <input required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={placa} onChange={e => setPlaca(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Año</label>
                  <input type="number" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={anio} onChange={e => setAnio(parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Marca</label>
                  <input required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={marca} onChange={e => setMarca(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modelo</label>
                  <input required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={modelo} onChange={e => setModelo(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente</label>
                  <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
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
