'use client'

import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  UserPlus, 
  X,
  AlertCircle,
  Users
} from 'lucide-react'

interface Cliente {
  id: number
  nombre: string
  telefono: string
  email: string
  direccion: string
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
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch clients
  const fetchClientes = async (query = '') => {
    try {
      setLoading(true)
      const res = await fetch(`/api/clientes${query ? `?q=${encodeURIComponent(query)}` : ''}`)
      if (!res.ok) throw new Error('Error al conectar con el servidor')
      const data = await res.json()
      setClientes(data)
      setError(null)
    } catch (err: unknown) {
      console.error(err)
      setError('No se pudieron cargar los clientes. Usando datos demo locales.')
      // Fallback demo data if PostgreSQL is not running
      setClientes([
        { id: 1, nombre: 'Juan Pérez', telefono: '555-0199', email: 'juan.perez@example.com', direccion: 'Av. Reforma 123, CDMX' },
        { id: 2, nombre: 'María Rodríguez', telefono: '555-0144', email: 'maria.rod@example.com', direccion: 'Calle Pino 45, Guadalajara' },
        { id: 3, nombre: 'Carlos Mendoza', telefono: '555-0177', email: 'carlos.m@example.com', direccion: 'Boulevard Colosio 890, Monterrey' },
        { id: 4, nombre: 'Ana Gómez', telefono: '555-0122', email: 'ana.gomez@example.com', direccion: 'Paseo de la Loma 12, Querétaro' }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      await fetchClientes()
    }
    void init()
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearch(val)
    // Debounced search or immediate search on change
    fetchClientes(val)
  }

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedCliente(null)
    setNombre('')
    setTelefono('')
    setEmail('')
    setDireccion('')
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
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre || !telefono || !email || !direccion) {
      setFormError('Todos los campos son obligatorios')
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
        body: JSON.stringify({ nombre, telefono, email, direccion })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al procesar el cliente')
      }

      setIsModalOpen(false)
      fetchClientes(search)
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Error en la conexión. Guardado simulado en modo demo.'
      setFormError(message)
      
      // Simulate client side update for demo mode if fetch fails
      if (modalMode === 'create') {
        const mockNew = { id: Date.now(), nombre, telefono, email, direccion }
        setClientes(prev => [...prev, mockNew])
        setIsModalOpen(false)
      } else if (modalMode === 'edit' && selectedCliente) {
        setClientes(prev => prev.map(c => c.id === selectedCliente.id ? { ...c, nombre, telefono, email, direccion } : c))
        setIsModalOpen(false)
      }
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
        throw new Error(data.error || 'Error al eliminar el cliente')
      }

      fetchClientes(search)
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Error al eliminar. Simulado en modo demo.'
      alert(message)
      // Simulate client side delete
      setClientes(prev => prev.filter(c => c.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Directorio de Clientes</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Administración, registro y detalles de contacto de los clientes
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <UserPlus className="h-4.5 w-4.5" />
          Registrar Cliente
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
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:focus:ring-blue-400/25 text-sm transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
            <p className="text-xs text-slate-400 dark:text-slate-500">Cargando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 dark:text-slate-600 mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-700 dark:text-slate-300">No se encontraron clientes</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
              {search ? 'Intenta modificar el término de búsqueda' : 'Registra tu primer cliente para comenzar a operar'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6">Cliente</th>
                  <th className="py-3 px-6">Información de Contacto</th>
                  <th className="py-3 px-6">Dirección</th>
                  <th className="py-3 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="py-4.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-slate-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                          {cliente.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{cliente.nombre}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">ID: #{cliente.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4.5 px-6 space-y-1">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs">{cliente.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs font-mono">{cliente.telefono}</span>
                      </div>
                    </td>
                    <td className="py-4.5 px-6 max-w-xs">
                      <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-xs line-clamp-2">{cliente.direccion}</span>
                      </div>
                    </td>
                    <td className="py-4.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(cliente)}
                          className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/20 transition-all cursor-pointer"
                          title="Editar cliente"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cliente.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                          title="Eliminar cliente"
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
                  {modalMode === 'create' ? 'Registrar Nuevo Cliente' : 'Editar Datos de Cliente'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Introduce los detalles del cliente para guardarlos en el taller
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
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez López"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:focus:ring-blue-400/25 text-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 555-12345"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:focus:ring-blue-400/25 text-sm transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Ej. juan@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:focus:ring-blue-400/25 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Dirección de Domicilio
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ej. Av. Universidad #432, Colonia Centro, Ciudad..."
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:focus:ring-blue-400/25 text-sm transition-all resize-none"
                />
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
                  disabled={formSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
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
