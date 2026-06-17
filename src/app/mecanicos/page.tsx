'use client'
import React, { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  Wrench,
  X,
  AlertCircle,
  Briefcase
} from 'lucide-react'
interface Mecanico {
  id_mecanico: number
  id_usuario: number
  especialidad: string | null
  estado: string
  usuario: {
    nombre: string
    correo: string
  }
}
interface Usuario {
  id_usuario: number
  nombre: string
  id_rol: number
}
export default function MecanicosPage() {
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedMecanico, setSelectedMecanico] = useState<Mecanico | null>(null)
  const [idUsuario, setIdUsuario] = useState<string>('')
  const [especialidad, setEspecialidad] = useState('')
  const [estado, setEstado] = useState('Disponible')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const fetchData = async () => {
    try {
      setLoading(true)
      const [mecRes, userRes] = await Promise.all([
        fetch('/api/mecanicos'),
        fetch('/api/usuarios')
      ])
      if (!mecRes.ok || !userRes.ok) throw new Error('Error al obtener datos')
      setMecanicos(await mecRes.json())
      setUsuarios(await userRes.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchData()
  }, [])
  const openCreateModal = () => {
    setModalMode('create')
    setSelectedMecanico(null)
    setIdUsuario(usuarios[0]?.id_usuario?.toString() || '')
    setEspecialidad('')
    setEstado('Disponible')
    setFormError(null)
    setIsModalOpen(true)
  }
  const openEditModal = (m: Mecanico) => {
    setModalMode('edit')
    setSelectedMecanico(m)
    setIdUsuario(m.id_usuario.toString())
    setEspecialidad(m.especialidad || '')
    setEstado(m.estado)
    setFormError(null)
    setIsModalOpen(true)
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setFormSubmitting(true)
      const url = modalMode === 'create' ? '/api/mecanicos' : `/api/mecanicos/${selectedMecanico?.id_mecanico}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_usuario: parseInt(idUsuario, 10),
          especialidad,
          estado
        })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.details || data.error || 'Error al procesar')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }
  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro?')) return
    try {
      const res = await fetch(`/api/mecanicos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }
  const filteredMecanicos = mecanicos.filter(m =>
    m.usuario.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (m.especialidad && m.especialidad.toLowerCase().includes(search.toLowerCase()))
  )
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-orange-600" />
            Equipo de Mecánicos
          </h1>
          <p className="text-slate-500 text-sm">Gestión de personal técnico y disponibilidad.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Registrar Mecánico
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o especialidad..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="px-6 py-4">Mecánico</th>
                <th className="px-6 py-4">Especialidad</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Cargando...</td>
                </tr>
              ) : filteredMecanicos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No se encontraron mecánicos.</td>
                </tr>
              ) : (
                filteredMecanicos.map(m => (
                  <tr key={m.id_mecanico} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                          {m.usuario.nombre[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{m.usuario.nombre}</p>
                          <p className="text-xs text-slate-500">{m.usuario.correo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700">{m.especialidad || 'General'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        m.estado === 'Disponible' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${m.estado === 'Disponible' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {m.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(m)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(m.id_mecanico)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
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
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">{modalMode === 'create' ? 'Asignar Rol de Mecánico' : 'Editar Mecánico'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Seleccionar Usuario</label>
                  <select
                    disabled={modalMode === 'edit'}
                    value={idUsuario}
                    onChange={e => setIdUsuario(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  >
                    {usuarios.filter(u => modalMode === 'edit' || !mecanicos.some(m => m.id_usuario === u.id_usuario)).map(u => (
                      <option key={u.id_usuario} value={u.id_usuario}>{u.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Especialidad</label>
                  <input
                    value={especialidad}
                    onChange={e => setEspecialidad(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    placeholder="Ej: Motores, Frenos..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Estado</label>
                  <select
                    value={estado}
                    onChange={e => setEstado(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Ocupado">Ocupado</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  {formSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : (modalMode === 'create' ? 'Guardar' : 'Actualizar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}