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
  Briefcase,
  User
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

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedMecanico, setSelectedMecanico] = useState<Mecanico | null>(null)

  // Form states
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Equipo de Mecánicos</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Gestión de personal técnico y disponibilidad</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" /> Registrar Mecánico
        </button>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar mecánico o especialidad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-600" /></div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-6">Nombre / Correo</th>
                <th className="py-3 px-6">Especialidad</th>
                <th className="py-3 px-6">Estado</th>
                <th className="py-3 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMecanicos.map(m => (
                <tr key={m.id_mecanico} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{m.usuario.nombre}</p>
                    <p className="text-[10px] text-slate-400">{m.usuario.correo}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                      {m.especialidad || 'General'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      m.estado === 'Disponible' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30'
                    }`}>
                      {m.estado}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(m)} className="p-1.5 text-slate-400 hover:text-amber-600"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(m.id_mecanico)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">{modalMode === 'create' ? 'Asignar Rol de Mecánico' : 'Editar Mecánico'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400"><X /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Seleccionar Usuario</label>
                <select disabled={modalMode === 'edit'} value={idUsuario} onChange={e => setIdUsuario(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm">
                   {usuarios.filter(u => modalMode === 'edit' || !mecanicos.some(m => m.id_usuario === u.id_usuario)).map(u => (
                      <option key={u.id_usuario} value={u.id_usuario}>{u.nombre}</option>
                   ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Especialidad</label>
                <input value={especialidad} onChange={e => setEspecialidad(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm" placeholder="Ej: Motores, Frenos, Suspensión..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Estado de Disponibilidad</label>
                <select value={estado} onChange={e => setEstado(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm">
                  <option value="Disponible">Disponible</option>
                  <option value="Ocupado">Ocupado</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400">Cancelar</button>
                <button type="submit" disabled={formSubmitting} className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-sm disabled:opacity-50 transition-colors">
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
