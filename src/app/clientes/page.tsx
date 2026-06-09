'use client'

import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  Mail, 
  Phone, 
  UserPlus, 
  X,
  AlertCircle,
  Users,
  CreditCard
} from 'lucide-react'

interface Cliente {
  id: number
  nombre: string
  telefono: string
  email: string
  direccion: string
  identidad?: string
  _count?: {
    vehiculos: number
  }
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  
  // Form states
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [identidad, setIdentidad] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch clients
  const fetchClientes = React.useCallback(async (query = '') => {
    try {
      setLoading(true)
      const res = await fetch(`/api/clientes${query ? `?q=${encodeURIComponent(query)}` : ''}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.details || errData.error || 'Error al conectar con el servidor')
      }
      const data = await res.json()
      setClientes(data)
      setError(null)
    } catch (err: unknown) {
      console.error(err)
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const loadData = async () => {
      if (mounted) {
        await fetchClientes()
      }
    }
    void loadData()
    return () => {
      mounted = false
    }
  }, [fetchClientes])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearch(val)
    fetchClientes(val)
  }

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedCliente(null)
    setNombre('')
    setTelefono('')
    setEmail('')
    setDireccion('')
    setIdentidad('')
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (cliente: Cliente) => {
    setModalMode('edit')
    setSelectedCliente(cliente)
    setNombre(cliente.nombre)
    setTelefono(cliente.telefono)
    setEmail(cliente.email)
    setDireccion(cliente.direccion)
    setIdentidad(cliente.identidad || '')
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre || !telefono || !email || !direccion) {
      setFormError('Todos los campos obligatorios deben ser completados')
      return
    }

    try {
      setFormSubmitting(true)
      setFormError(null)

      const url = modalMode === 'create' ? '/api/clientes' : `/api/clientes/${selectedCliente?.id}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, telefono, email, direccion, identidad })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.details || data.error || 'Ocurrió un error al procesar el cliente')
      }

      setIsModalOpen(false)
      fetchClientes(search)
    } catch (err: unknown) {
      console.error(err)
      setFormError(err instanceof Error ? err.message : String(err))
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente? Se eliminarán todos sus vehículos y órdenes asociadas.')) return

    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.details || data.error || 'Error al eliminar el cliente')
      }

      void fetchClientes(search)
    } catch (err: unknown) {
      console.error(err)
      alert(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Directorio de Clientes</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Administración, registro y detalles de contacto de los clientes
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
        >
          <UserPlus className="h-4.5 w-4.5" />
          Registrar Cliente
        </button>
      </div>

      {/* Search and warnings */}
      <div className="flex flex-col gap-4">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/35">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 text-sm transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-400">Cargando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4 text-slate-500">
            <Users className="h-10 w-10 mb-4 opacity-20" />
            <h4 className="font-bold">No se encontraron clientes</h4>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6">Cliente / Identidad</th>
                  <th className="py-3 px-6">Contacto</th>
                  <th className="py-3 px-6">Dirección</th>
                  <th className="py-3 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {cliente.nombre.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{cliente.nombre}</p>
                          {cliente.identidad && (
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <CreditCard className="h-2.5 w-2.5" /> {cliente.identidad}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Mail className="h-3 w-3" /> {cliente.email}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Phone className="h-3 w-3" /> {cliente.telefono}
                      </div>
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                       <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{cliente.direccion}</p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(cliente)}
                          aria-label={`Editar cliente ${cliente.nombre}`}
                          title="Editar cliente"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cliente.id)}
                          aria-label={`Eliminar cliente ${cliente.nombre}`}
                          title="Eliminar cliente"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                {modalMode === 'create' ? 'Registrar Nuevo Cliente' : 'Editar Datos de Cliente'}
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="nombre" className="text-[10px] font-bold text-slate-500 uppercase">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  id="nombre"
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="telefono" className="text-[10px] font-bold text-slate-500 uppercase">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="telefono"
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-[10px] font-bold text-slate-500 uppercase">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="identidad" className="text-[10px] font-bold text-slate-500 uppercase">N° Identidad</label>
                <input
                  id="identidad"
                  type="text"
                  value={identidad}
                  onChange={(e) => setIdentidad(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="direccion" className="text-[10px] font-bold text-slate-500 uppercase">
                  Dirección <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="direccion"
                  required
                  rows={2}
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {modalMode === 'create' ? 'Guardar Cliente' : 'Actualizar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
