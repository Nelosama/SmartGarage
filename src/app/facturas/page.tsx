'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Receipt, Search, Plus, Edit2, Trash2, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface FacturaResumen {
  id_factura: number
  numero_factura: string
  id_orden: number
  cliente: string
  placa: string
  marca: string
  modelo: string
  fecha_emision: string
  total: number
  estado_pago: string
  metodo_pago: string
  subtotal_servicios: number
  subtotal_repuestos: number
  impuesto: number
  descuento: number
}

interface Orden {
  id_orden: number
  vehiculo: {
    placa: string
    cliente: {
      usuario: {
        nombre: string
      }
    }
  }
}

export default function FacturasPage() {
  const { data: session, status } = useSession()
  const user = session?.user as { id_rol: number; id_usuario: string; nombre: string } | null
  const [facturas, setFacturas] = useState<FacturaResumen[]>([])
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentFactura, setCurrentFactura] = useState<FacturaResumen | null>(null)

  const [formData, setFormData] = useState({
    id_orden: '',
    numero_factura: '',
    subtotal_servicios: 0,
    subtotal_repuestos: 0,
    impuesto: 0,
    descuento: 0,
    estado_pago: 'Pendiente',
    metodo_pago: ''
  })

  const fetchFacturas = useCallback(async () => {
    try {
      const res = await fetch('/api/facturas')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setFacturas(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching facturas:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOrdenes = useCallback(async () => {
    try {
      const res = await fetch('/api/ordenes')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setOrdenes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching ordenes:', error)
    }
  }, [])

  useEffect(() => {
    let mounted = true;
    if (status === 'authenticated' && user) {
      (async () => {
        if (!mounted) return;
        await fetchFacturas();
        const roleId = Number(user.id_rol);
        if (roleId === 1 || roleId === 2) {
          await fetchOrdenes();
        }
      })();
    }
    return () => { mounted = false };
  }, [status, user, fetchFacturas, fetchOrdenes])

  const filteredFacturas = useMemo(() => {
    return facturas.filter(f =>
      f.numero_factura?.toLowerCase().includes(search.toLowerCase()) ||
      f.cliente?.toLowerCase().includes(search.toLowerCase()) ||
      f.placa?.toLowerCase().includes(search.toLowerCase()) ||
      f.id_orden?.toString().includes(search)
    )
  }, [facturas, search])

  const totalCalculated = useMemo(() => {
    return (
      Number(formData.subtotal_servicios) +
      Number(formData.subtotal_repuestos) +
      Number(formData.impuesto) -
      Number(formData.descuento)
    )
  }, [formData])

  const resetForm = useCallback(() => {
    setFormData({
      id_orden: '',
      numero_factura: '',
      subtotal_servicios: 0,
      subtotal_repuestos: 0,
      impuesto: 0,
      descuento: 0,
      estado_pago: 'Pendiente',
      metodo_pago: ''
    })
    setCurrentFactura(null)
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, total: totalCalculated })
      })
      if (res.ok) {
        setShowCreateModal(false)
        await fetchFacturas()
        resetForm()
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Error al crear factura')
      }
    } catch (error) {
      console.error('Error creating factura:', error)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentFactura) return
    try {
      const res = await fetch(`/api/facturas/${currentFactura.id_factura}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, total: totalCalculated })
      })
      if (res.ok) {
        setShowEditModal(false)
        await fetchFacturas()
        resetForm()
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Error al actualizar factura')
      }
    } catch (error) {
      console.error('Error updating factura:', error)
    }
  }

  const handleDelete = async () => {
    if (!currentFactura) return
    try {
      const res = await fetch(`/api/facturas/${currentFactura.id_factura}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setShowDeleteModal(false)
        await fetchFacturas()
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Error al eliminar factura')
      }
    } catch (error) {
      console.error('Error deleting factura:', error)
    }
  }

  const openEdit = (f: FacturaResumen) => {
    setCurrentFactura(f)
    setFormData({
      id_orden: f.id_orden?.toString() || '',
      numero_factura: f.numero_factura || '',
      subtotal_servicios: Number(f.subtotal_servicios) || 0,
      subtotal_repuestos: Number(f.subtotal_repuestos) || 0,
      impuesto: Number(f.impuesto) || 0,
      descuento: Number(f.descuento) || 0,
      estado_pago: f.estado_pago || 'Pendiente',
      metodo_pago: f.metodo_pago || ''
    })
    setShowEditModal(true)
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Pagado': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'Pendiente': return 'bg-amber-50 text-amber-700 border-amber-100'
      case 'Anulado': return 'bg-red-50 text-red-700 border-red-100'
      default: return 'bg-slate-50 text-slate-700 border-slate-100'
    }
  }

  if (status === 'loading') {
    return <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Cargando datos de sesión...</div>
  }

  const roleId = Number(user?.id_rol)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Receipt className="h-8 w-8 text-orange-600" />
            Facturación
          </h1>
          <p className="text-slate-500 text-sm">Gestiona los pagos y comprobantes del taller.</p>
        </div>
        {(roleId === 1 || roleId === 2) && (
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/20"
          >
            <Plus className="h-5 w-5" />
            Nueva Factura
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por factura, cliente, placa o ID de orden..."
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
                <th className="px-6 py-4">Factura #</th>
                <th className="px-6 py-4">Orden / Vehículo</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4">Método</th>
                {(roleId === 1 || roleId === 2) && <th className="px-6 py-4 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Cargando...</td></tr>
              ) : filteredFacturas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="h-10 w-10 text-slate-200" />
                      <p className="text-slate-500 font-medium">No se encontraron facturas.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredFacturas.map(f => (
                <tr key={f.id_factura} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{f.numero_factura}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-700">Orden #{f.id_orden}</div>
                    <div className="text-xs text-slate-500">{f.marca} {f.modelo} ({f.placa})</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{f.cliente}</td>
                  <td className="px-6 py-4">
                    <div className="font-black text-orange-600">{formatCurrency(f.total)}</div>
                    <div className="text-[10px] text-slate-400">{formatDate(f.fecha_emision)}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(f.estado_pago)}`}>
                      {f.estado_pago}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{f.metodo_pago || 'No definido'}</td>
                  {(roleId === 1 || roleId === 2) && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(f)}
                          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                          title="Editar factura"
                          aria-label="Editar factura"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {roleId === 1 && (
                          <button
                            onClick={() => { setCurrentFactura(f); setShowDeleteModal(true); }}
                            disabled={f.estado_pago === 'Pagado'}
                            className={`p-2 rounded-lg transition-all ${f.estado_pago === 'Pagado' ? 'opacity-30 cursor-not-allowed text-slate-300' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                            title={f.estado_pago === 'Pagado' ? "No se puede eliminar una factura pagada" : "Eliminar factura"}
                            aria-label="Eliminar factura"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">Generar Nueva Factura</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="id_orden" className="text-sm font-bold text-slate-700">Orden de Trabajo</label>
                  <select
                    id="id_orden"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.id_orden}
                    onChange={(e) => setFormData({ ...formData, id_orden: e.target.value })}
                  >
                    <option value="">Seleccione una orden...</option>
                    {ordenes.filter(o => !facturas.some(f => f.id_orden === o.id_orden)).map(o => (
                      <option key={o.id_orden} value={o.id_orden}>
                        Orden #{o.id_orden} - {o.vehiculo?.placa} ({o.vehiculo?.cliente?.usuario?.nombre})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="numero_factura" className="text-sm font-bold text-slate-700">Número de Factura</label>
                  <input
                    id="numero_factura"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    placeholder="FAC-001"
                    value={formData.numero_factura}
                    onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="subtotal_servicios" className="text-sm font-bold text-slate-700">Subtotal Servicios (L)</label>
                  <input
                    id="subtotal_servicios"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.subtotal_servicios}
                    onChange={(e) => setFormData({ ...formData, subtotal_servicios: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="subtotal_repuestos" className="text-sm font-bold text-slate-700">Subtotal Repuestos (L)</label>
                  <input
                    id="subtotal_repuestos"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.subtotal_repuestos}
                    onChange={(e) => setFormData({ ...formData, subtotal_repuestos: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="impuesto" className="text-sm font-bold text-slate-700">Impuesto (L)</label>
                  <input
                    id="impuesto"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.impuesto}
                    onChange={(e) => setFormData({ ...formData, impuesto: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="descuento" className="text-sm font-bold text-slate-700">Descuento (L)</label>
                  <input
                    id="descuento"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.descuento}
                    onChange={(e) => setFormData({ ...formData, descuento: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="estado_pago" className="text-sm font-bold text-slate-700">Estado de Pago</label>
                  <select
                    id="estado_pago"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.estado_pago}
                    onChange={(e) => setFormData({ ...formData, estado_pago: e.target.value })}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagado">Pagado</option>
                    <option value="Anulado">Anulado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="metodo_pago" className="text-sm font-bold text-slate-700">Método de Pago</label>
                  <input
                    id="metodo_pago"
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    placeholder="Efectivo, Tarjeta, Transferencia"
                    value={formData.metodo_pago}
                    onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-8 p-6 bg-orange-50 rounded-2xl flex items-center justify-between border border-orange-100">
                <span className="text-orange-800 font-bold uppercase tracking-wider text-sm">Total a Facturar</span>
                <span className="text-3xl font-black text-orange-600">{formatCurrency(totalCalculated)}</span>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold transition-all"
                >
                  Generar Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">Editar Factura: {currentFactura?.numero_factura}</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="edit_numero_factura" className="text-sm font-bold text-slate-700">Número de Factura</label>
                  <input
                    id="edit_numero_factura"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.numero_factura}
                    onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit_estado_pago" className="text-sm font-bold text-slate-700">Estado de Pago</label>
                  <select
                    id="edit_estado_pago"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.estado_pago}
                    onChange={(e) => setFormData({ ...formData, estado_pago: e.target.value })}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagado">Pagado</option>
                    <option value="Anulado">Anulado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit_subtotal_servicios" className="text-sm font-bold text-slate-700">Subtotal Servicios (L)</label>
                  <input
                    id="edit_subtotal_servicios"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.subtotal_servicios}
                    onChange={(e) => setFormData({ ...formData, subtotal_servicios: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit_subtotal_repuestos" className="text-sm font-bold text-slate-700">Subtotal Repuestos (L)</label>
                  <input
                    id="edit_subtotal_repuestos"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.subtotal_repuestos}
                    onChange={(e) => setFormData({ ...formData, subtotal_repuestos: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit_impuesto" className="text-sm font-bold text-slate-700">Impuesto (L)</label>
                  <input
                    id="edit_impuesto"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.impuesto}
                    onChange={(e) => setFormData({ ...formData, impuesto: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit_descuento" className="text-sm font-bold text-slate-700">Descuento (L)</label>
                  <input
                    id="edit_descuento"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.descuento}
                    onChange={(e) => setFormData({ ...formData, descuento: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="edit_metodo_pago" className="text-sm font-bold text-slate-700">Método de Pago</label>
                  <input
                    id="edit_metodo_pago"
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    value={formData.metodo_pago}
                    onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-8 p-6 bg-orange-50 rounded-2xl flex items-center justify-between border border-orange-100">
                <span className="text-orange-800 font-bold uppercase tracking-wider text-sm">Total Actualizado</span>
                <span className="text-3xl font-black text-orange-600">{formatCurrency(totalCalculated)}</span>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2">¿Eliminar Factura?</h2>
              <p className="text-slate-500 mb-8">
                Esta acción no se puede deshacer. La factura <span className="font-bold text-slate-700">{currentFactura?.numero_factura}</span> será eliminada permanentemente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition-all"
                >
                  No, mantener
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 font-bold transition-all shadow-lg shadow-red-500/20"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
