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
  TrendingDown
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedRepuesto, setSelectedRepuesto] = useState<Repuesto | null>(null)
  const [nombre, setNombre] = useState('')
  const [marca, setMarca] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [stock, setStock] = useState<number>(0)
  const [precio, setPrecio] = useState<number>(0)
  const [stockMin, setStockMin] = useState<number>(0)
  const [estado, setEstado] = useState('Activo')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/repuestos')
      if (!res.ok) throw new Error('Error al obtener datos')
      setRepuestos(await res.json())
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
    setSelectedRepuesto(null)
    setNombre('')
    setMarca('')
    setDescripcion('')
    setStock(0)
    setPrecio(0)
    setStockMin(0)
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
    setPrecio(Number(r.precio_unitario))
    setStockMin(r.stock_minimo)
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
          stock,
          precio_unitario: precio,
          stock_minimo: stockMin,
          estado
        })
      })
      if (!res.ok) throw new Error('Error al procesar')
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
      const res = await fetch(`/api/repuestos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }
  const filteredRepuestos = repuestos.filter(r =>
    r.nombre_repuesto.toLowerCase().includes(search.toLowerCase()) ||
    (r.marca && r.marca.toLowerCase().includes(search.toLowerCase()))
  )
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Package className="h-8 w-8 text-orange-600" />
            Inventario de Repuestos
          </h1>
          <p className="text-slate-500 text-sm">Control de stock y precios de partes.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Nuevo Repuesto
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o marca..."
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
                <th className="px-6 py-4">Repuesto</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Cargando...</td></tr>
              ) : filteredRepuestos.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No hay resultados.</td></tr>
              ) : (
                filteredRepuestos.map(r => (
                  <tr key={r.id_repuesto} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{r.nombre_repuesto}</p>
                      <p className="text-xs text-slate-500">{r.marca || 'Genérico'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-bold ${r.stock <= r.stock_minimo ? 'text-red-600' : 'text-slate-700'}`}>{r.stock}</span>
                        {r.stock <= r.stock_minimo && <span className="text-[10px] text-red-500 font-bold flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Bajo Stock</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-orange-600">L {Number(r.precio_unitario).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(r)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(r.id_repuesto)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
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
              <h2 className="text-xl font-black text-slate-800">{modalMode === 'create' ? 'Nuevo Repuesto' : 'Editar Repuesto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                  <input required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={nombre} onChange={e => setNombre(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Marca</label>
                  <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={marca} onChange={e => setMarca(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio Unitario</label>
                  <input type="number" step="0.01" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={precio} onChange={e => setPrecio(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Actual</label>
                  <input type="number" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={stock} onChange={e => setStock(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Mínimo</label>
                  <input type="number" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={stockMin} onChange={e => setStockMin(Number(e.target.value))} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all">Cancelar</button>
                <button type="submit" disabled={formSubmitting} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 active:scale-95">{formSubmitting ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}