'use client'

import React, { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  Package,
  X,
  AlertCircle,
  Tag,
  Boxes
} from 'lucide-react'

interface Repuesto {
  id_repuesto: number
  nombre_repuesto: string
  marca: string | null
  descripcion: string | null
  stock: number
  precio_unitario: number
  stock_minimo: number
  estado: string
}

export default function RepuestosPage() {
  const [repuestos, setRepuestos] = useState<Repuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedRepuesto, setSelectedRepuesto] = useState<Repuesto | null>(null)

  // Form states
  const [nombre, setNombre] = useState('')
  const [marca, setMarca] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [stock, setStock] = useState<number>(0)
  const [precioUnitario, setPrecioUnitario] = useState<number>(0)
  const [stockMinimo, setStockMinimo] = useState<number>(0)
  const [estado, setEstado] = useState('Activo')

  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchRepuestos = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/repuestos')
      if (!res.ok) throw new Error('Error al obtener repuestos')
      const data = await res.json()
      setRepuestos(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRepuestos()
  }, [])

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedRepuesto(null)
    setNombre('')
    setMarca('')
    setDescripcion('')
    setStock(0)
    setPrecioUnitario(0)
    setStockMinimo(0)
    setEstado('Activo')
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (r: Repuesto) => {
    setModalMode('edit')
    setSelectedRepuesto(r)
    setNombre(r.nombre_repuesto)
    setMarca(r.marca || '')
    setDescripcion(r.descripcion || '')
    setStock(r.stock)
    setPrecioUnitario(Number(r.precio_unitario))
    setStockMinimo(r.stock_minimo)
    setEstado(r.estado)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setFormSubmitting(true)
      const url = modalMode === 'create' ? '/api/repuestos' : `/api/repuestos/${selectedRepuesto?.id_repuesto}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_repuesto: nombre,
          marca,
          descripcion,
          stock: Number(stock),
          precio_unitario: Number(precioUnitario),
          stock_minimo: Number(stockMinimo),
          estado
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.details || data.error || 'Error al procesar')
      }

      setIsModalOpen(false)
      fetchRepuestos()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro?')) return
    try {
      const res = await fetch(`/api/repuestos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      fetchRepuestos()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const filteredRepuestos = repuestos.filter(r =>
    r.nombre_repuesto.toLowerCase().includes(search.toLowerCase()) ||
    (r.marca && r.marca.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Inventario de Repuestos</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Gestión de stock y precios de partes</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" /> Nuevo Repuesto
        </button>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar repuesto o marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" /></div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-6">Repuesto / Marca</th>
                <th className="py-3 px-6">Stock</th>
                <th className="py-3 px-6">Precio Unit.</th>
                <th className="py-3 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRepuestos.map(r => (
                <tr key={r.id_repuesto} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{r.nombre_repuesto}</p>
                    <p className="text-[10px] text-indigo-500 font-semibold uppercase">{r.marca || 'Genérico'}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                       <span className={`font-bold ${r.stock <= r.stock_minimo ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>{r.stock}</span>
                       <span className="text-[10px] text-slate-400">min: {r.stock_minimo}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">${Number(r.precio_unitario).toFixed(2)}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(r)} className="p-1.5 text-slate-400 hover:text-indigo-600"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(r.id_repuesto)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
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
              <h3 className="text-lg font-black">{modalMode === 'create' ? 'Nuevo Repuesto' : 'Editar Repuesto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400"><X /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre del Repuesto</label>
                <input required value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Marca</label>
                  <input value={marca} onChange={e => setMarca(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Estado</label>
                  <select value={estado} onChange={e => setEstado(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm">
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Descripción</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Stock Actual</label>
                  <input type="number" required value={stock} onChange={e => setStock(parseInt(e.target.value, 10))} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Stock Mínimo</label>
                  <input type="number" required value={stockMinimo} onChange={e => setStockMinimo(parseInt(e.target.value, 10))} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Precio Unit. ($)</label>
                  <input type="number" step="0.01" required value={precioUnitario} onChange={e => setPrecioUnitario(parseFloat(e.target.value))} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400">Cancelar</button>
                <button type="submit" disabled={formSubmitting} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-50 transition-colors">
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
